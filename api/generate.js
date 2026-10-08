/* POST /api/generate — vérifie les crédits, les retire, lance la génération */
import { admin, getUser, kie } from "./_lib.js";
import { COSTS, MODELS, buildInput } from "./_config.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Non connecté" });

  const { mode, prompt, imageUrls } = req.body || {};
  if (!["photo", "video"].includes(mode)) return res.status(400).json({ error: "Mode invalide" });
  if (typeof prompt !== "string" || prompt.trim().length < 3 || prompt.length > 1000)
    return res.status(400).json({ error: "Description invalide" });
  if (!Array.isArray(imageUrls) || imageUrls.length < 1 || imageUrls.length > 2)
    return res.status(400).json({ error: "Photo manquante" });

  /* N'accepte que des photos envoyées sur TON stockage Supabase */
  const allowed = `${process.env.SUPABASE_URL}/storage/v1/object/public/uploads/${user.id}/`;
  if (!imageUrls.every((u) => typeof u === "string" && u.startsWith(allowed)))
    return res.status(400).json({ error: "Photo non autorisée" });

  if (mode === "video" && !MODELS.video) return res.status(503).json({ error: "La vidéo n'est pas encore activée." });

  const cost = COSTS[mode];

  /* Retire les crédits (refusé s'il n'y en a pas assez) */
  const { data: ok, error: spendErr } = await admin.rpc("spend_credits", { p_user: user.id, p_amount: cost });
  if (spendErr) return res.status(500).json({ error: "Erreur crédits" });
  if (!ok) return res.status(402).json({ error: "Crédits insuffisants" });

  const { data: gen, error: insErr } = await admin.from("generations")
    .insert({ user_id: user.id, mode, prompt, input_urls: imageUrls, cost })
    .select("id").single();
  if (insErr) {
    await admin.rpc("add_credits", { p_user: user.id, p_amount: cost });
    return res.status(500).json({ error: "Erreur base de données" });
  }

  /* Lance la tâche chez kie.ai */
  const task = await kie("/jobs/createTask", {
    method: "POST",
    body: JSON.stringify({ model: MODELS[mode], input: buildInput(mode, prompt, imageUrls) }),
  }).catch(() => null);

  if (!task || task.code !== 200 || !task.data?.taskId) {
    await admin.from("generations").update({ status: "failed", error: task?.msg || "createTask" }).eq("id", gen.id);
    await admin.rpc("add_credits", { p_user: user.id, p_amount: cost });
    return res.status(502).json({ error: "Le service IA est indisponible, ton crédit t'a été rendu." });
  }

  await admin.from("generations").update({ task_id: task.data.taskId }).eq("id", gen.id);
  return res.status(200).json({ id: gen.id });
}

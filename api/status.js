/* GET /api/status?id=… — demande à kie.ai où en est la génération */
import { admin, getUser, kie } from "./_lib.js";

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Non connecté" });

  const { data: gen } = await admin.from("generations")
    .select("id, user_id, mode, status, task_id, result_url, cost")
    .eq("id", req.query.id).single();
  if (!gen || gen.user_id !== user.id) return res.status(404).json({ error: "Introuvable" });
  if (gen.status !== "pending" || !gen.task_id) return res.status(200).json(gen);

  const info = await kie("/jobs/recordInfo?taskId=" + encodeURIComponent(gen.task_id)).catch(() => null);
  const state = info?.data?.state;

  if (state === "success") {
    let url = null;
    try { url = JSON.parse(info.data.resultJson).resultUrls[0]; } catch (e) {}
    if (url) {
      await admin.from("generations").update({ status: "success", result_url: url }).eq("id", gen.id).eq("status", "pending");
      return res.status(200).json({ ...gen, status: "success", result_url: url });
    }
  }

  /* "fail", ou "success" sans image = échec */
  if (state === "fail" || state === "success") {
    /* Échec : on marque l'échec UNE seule fois puis on rend les crédits */
    const { data: updated } = await admin.from("generations")
      .update({ status: "failed", error: info?.data?.failMsg || "fail" })
      .eq("id", gen.id).eq("status", "pending").select("id");
    if (updated && updated.length) await admin.rpc("add_credits", { p_user: user.id, p_amount: gen.cost });
    return res.status(200).json({ ...gen, status: "failed" });
  }

  return res.status(200).json(gen); /* toujours en cours */
}

/* POST /api/whop-webhook?secret=… — Whop prévient ici à chaque paiement réussi.
   On retrouve le client par son email et on lui ajoute les crédits de sa formule. */
import { admin } from "./_lib.js";
import { WHOP_PLANS } from "./_config.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!process.env.WHOP_WEBHOOK_SECRET || req.query.secret !== process.env.WHOP_WEBHOOK_SECRET)
    return res.status(401).json({ error: "Secret invalide" });

  const body = req.body || {};
  const event = body.action || body.type || body.event || "";
  const data = body.data || {};
  console.log("Whop webhook reçu :", event, JSON.stringify(data).slice(0, 1500));

  if (!/payment[._]succeeded/.test(event)) return res.status(200).json({ ignored: event });

  const paymentId = data.id || body.id;
  const email = (data.user?.email || data.email || data.customer?.email || data.member?.email || "").toLowerCase();
  const planId = data.plan_id || data.plan?.id || data.membership?.plan_id || data.product_plan_id;
  const offer = WHOP_PLANS[planId];

  if (!paymentId || !email || !offer) {
    console.log("Paiement non traité : vérifier email / plan_id", { paymentId, email, planId });
    return res.status(200).json({ unhandled: true });
  }

  /* Un paiement n'est crédité qu'une fois, même si Whop renvoie le message */
  const { error: dup } = await admin.from("payments").insert({ id: String(paymentId), email, plan: offer.plan, credits: offer.credits });
  if (dup) return res.status(200).json({ duplicate: true });

  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).single();
  if (!profile) {
    console.log("Aucun compte avec cet email :", email);
    return res.status(200).json({ noAccount: true });
  }

  await admin.rpc("add_credits", { p_user: profile.id, p_amount: offer.credits });
  await admin.from("profiles").update({ plan: offer.plan }).eq("id", profile.id);
  await admin.from("payments").update({ user_id: profile.id }).eq("id", String(paymentId));
  return res.status(200).json({ ok: true });
}

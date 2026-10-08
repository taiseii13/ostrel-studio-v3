/* =========================================================
   RÉGLAGES CÔTÉ SERVEUR (invisibles pour les clients)
   ========================================================= */

/* Coût en crédits — doit être identique à COSTS dans assets/config.js */
export const COSTS = { photo: 1, video: 10 };

/* Modèles IA kie.ai.
   - Photo : Nano Banana Edit (retouche à partir de tes photos).
   - Vidéo : mets dans Vercel la variable KIE_VIDEO_MODEL avec le nom exact
     du modèle "image to video" choisi sur docs.kie.ai (ex : un modèle Kling). */
export const MODELS = {
  photo: "google/nano-banana-edit",
  video: process.env.KIE_VIDEO_MODEL || "",
};

/* Ce qui est envoyé à l'IA. Si tu changes de modèle vidéo, vérifie sur
   docs.kie.ai le nom exact des champs attendus et adapte "video". */
export function buildInput(mode, prompt, imageUrls) {
  if (mode === "video") {
    return { prompt, image_url: imageUrls[0] };
  }
  return { prompt, image_urls: imageUrls, output_format: "png" };
}

/* Crédits donnés à chaque paiement Whop.
   Clé = l'ID de la formule ("plan_…") que Whop affiche dans ton tableau de bord.
   Annuel : on crédite les 12 mois d'un coup (ex : 15 photos x 12 = 180).
   Pro : 50 photos (50 crédits) + 5 vidéos (5 x 10 crédits) = 100 crédits par mois. */
export const WHOP_PLANS = {
  "plan_COLLE_ID_DECOUVERTE_MENSUEL": { plan: "Découverte", credits: 15 },
  "plan_COLLE_ID_DECOUVERTE_ANNUEL":  { plan: "Découverte", credits: 180 },
  "plan_COLLE_ID_PRO_MENSUEL":        { plan: "Pro", credits: 100 },
  "plan_COLLE_ID_PRO_ANNUEL":         { plan: "Pro", credits: 1200 },
  "plan_COLLE_ID_ULTIMATE_MENSUEL":   { plan: "Ultimate", credits: 400 },
  "plan_COLLE_ID_ULTIMATE_ANNUEL":    { plan: "Ultimate", credits: 4800 },
};

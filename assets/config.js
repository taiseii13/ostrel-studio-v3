/* =========================================================
   CONFIG.JS — TOUT CE QUE TU PEUX MODIFIER SANS CODER
   (nom, email, clés publiques, formules, images de l'app)
   ========================================================= */

const SITE = {
  name: "[NOM DU SITE]",            // ex : "Ostrel Studio"
  email: "[contact@tondomaine.fr]", // ton email de contact
  year: new Date().getFullYear(),
};

/* ---------- Supabase (clés PUBLIQUES, sans risque ici) ----------
   Supabase > Project Settings > API :
   - "Project URL"       -> url
   - "anon public" key   -> anonKey
   ⚠️ Ne mets JAMAIS ici la clé "service_role" (elle va dans Vercel). */
const SUPABASE = {
  url: "https://XXXXXXXX.supabase.co",
  anonKey: "COLLE_ICI_TA_CLE_ANON_PUBLIQUE",
};

/* ---------- Coût en crédits de chaque action ----------
   ⚠️ Doit être identique à api/_config.js (côté serveur). */
const COSTS = { photo: 1, video: 10 };

/* ---------- Formules affichées dans la fenêtre d'abonnement ----------
   - Les prix ici sont ceux AFFICHÉS : ils doivent être identiques à ceux de Whop.
   - whopMonthly / whopYearly = tes liens de paiement Whop (un par formule et par période).
   - En annuel, le gros chiffre affiché = le montant réellement prélevé (yearlyPrice).
   - Pour enlever une ligne d'avantage : supprime-la de la liste "perks".            */
const PLANS = [
  {
    id: "decouverte",
    name: "Découverte",
    badge: "",
    monthlyPrice: "7,90 €",
    yearlyPrice: "79,90 €",
    yearlyEquivalent: "6,66 €",
    oldMonthly: "",              // prix barré : laisse vide sauf s'il a vraiment été pratiqué
    photosPerMonth: "15 photos",
    perks: [
      "15 photos par mois",
      "Qualité HD",
      "Crédit rendu si la génération échoue",
      "Historique de tes 100 dernières créations",
    ],
    whopMonthly: "https://whop.com/checkout/COLLE_TON_LIEN_DECOUVERTE_MENSUEL",
    whopYearly: "https://whop.com/checkout/COLLE_TON_LIEN_DECOUVERTE_ANNUEL",
  },
  {
    id: "pro",
    name: "Pro",
    badge: "LE PLUS CHOISI",
    monthlyPrice: "14,90 €",
    yearlyPrice: "149,90 €",
    yearlyEquivalent: "12,49 €",
    oldMonthly: "",
    photosPerMonth: "50 photos + 5 vidéos",
    perks: [
      "50 photos et 5 vidéos par mois",
      "1 photo de référence par création",
      "Sans filigrane",
      "Génération prioritaire",
    ],
    whopMonthly: "https://whop.com/checkout/COLLE_TON_LIEN_PRO_MENSUEL",
    whopYearly: "https://whop.com/checkout/COLLE_TON_LIEN_PRO_ANNUEL",
  },
  {
    id: "ultimate",
    name: "Ultimate",
    badge: "",
    monthlyPrice: "34,90 €",
    yearlyPrice: "349,90 €",
    yearlyEquivalent: "29,16 €",
    oldMonthly: "",
    photosPerMonth: "300 photos + 10 vidéos",
    perks: [
      "300 photos et 10 vidéos par mois",
      "2 photos de référence par création",
      "Support prioritaire",
      "Historique complet",
    ],
    whopMonthly: "https://whop.com/checkout/COLLE_TON_LIEN_ULTIMATE_MENSUEL",
    whopYearly: "https://whop.com/checkout/COLLE_TON_LIEN_ULTIMATE_ANNUEL",
  },
];

/* ---------- Images de la section "Inspirations" de l'app ----------
   Remplace "" par le chemin de ton image, ex : "images/inspi-1.jpg".
   Laisse "" pour garder le rectangle "IMAGE X".                       */
const INSPIRATIONS = [
  { image: "", prompt: "Remplace l'arrière-plan par une plage au coucher du soleil" },
  { image: "", prompt: "Change ma tenue pour un costume noir élégant" },
  { image: "", prompt: "Mets-moi dans un appartement moderne à Paris" },
  { image: "", prompt: "Transforme la photo en ambiance cinéma, lumière dorée" },
];

/* ---------- Liens du menu de l'app ---------- */
const APP_LINKS = {
  discord: "",   // laisse vide pour cacher le bouton
};

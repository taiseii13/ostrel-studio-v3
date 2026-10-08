/* Outils partagés par les fonctions serveur — rien à modifier ici. */
import { createClient } from "@supabase/supabase-js";

export const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* Retrouve l'utilisateur connecté à partir de son jeton */
export async function getUser(req) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user;
}

export async function kie(path, options = {}) {
  const res = await fetch("https://api.kie.ai/api/v1" + path, {
    ...options,
    headers: { Authorization: "Bearer " + process.env.KIE_API_KEY, "Content-Type": "application/json" },
  });
  return res.json();
}

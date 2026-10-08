/* =========================================================
   AUTH.JS — connexion / inscription avec Supabase
   (rien à modifier ici : les clés sont dans config.js)
   ========================================================= */

const sb = window.supabase.createClient(SUPABASE.url, SUPABASE.anonKey);

function showMsg(el, text, ok) {
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? "#86efac" : "#fca5a5";
}

/* Connexion avec Google (redirige vers app.html une fois connecté) */
async function loginWithGoogle() {
  await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/app.html" },
  });
}

/* Formulaire d'inscription */
async function handleSignup(e) {
  e.preventDefault();
  const msg = document.getElementById("auth-msg");
  const { error } = await sb.auth.signUp({
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    options: {
      data: { first_name: document.getElementById("name").value.trim() },
      emailRedirectTo: window.location.origin + "/app.html",
    },
  });
  if (error) return showMsg(msg, "Erreur : " + error.message);
  showMsg(msg, "Compte créé ! Vérifie tes emails pour confirmer ton adresse.", true);
}

/* Formulaire de connexion */
async function handleLogin(e) {
  e.preventDefault();
  const msg = document.getElementById("auth-msg");
  const { error } = await sb.auth.signInWithPassword({
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
  });
  if (error) return showMsg(msg, "Email ou mot de passe incorrect.");
  window.location.href = "app.html";
}

/* Si déjà connecté sur connexion/inscription -> direction l'app */
sb.auth.getSession().then(({ data }) => {
  const page = window.location.pathname;
  if (data.session && (page.includes("connexion") || page.includes("inscription"))) {
    window.location.href = "app.html";
  }
});

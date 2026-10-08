/* =========================================================
   APP.JS — fonctionnement de l'outil (app.html)
   Rien à modifier ici en temps normal : les réglages sont dans config.js
   ========================================================= */

const sb = window.supabase.createClient(SUPABASE.url, SUPABASE.anonKey);
const state = { user: null, session: null, mode: "photo", period: "monthly", files: { main: null, ref: null } };

/* ---------- Démarrage : il faut être connecté ---------- */
(async function init() {
  const { data } = await sb.auth.getSession();
  if (!data.session) return (window.location.href = "connexion.html");
  state.session = data.session;
  state.user = data.session.user;

  document.querySelectorAll("[data-site='name']").forEach((n) => (n.textContent = SITE.name));
  document.title = document.title.replace("[NOM DU SITE]", SITE.name);
  document.getElementById("user-email").textContent = state.user.email;
  document.getElementById("modal-email").textContent = state.user.email;
  if (APP_LINKS.discord) {
    const d = document.getElementById("discord-link");
    d.href = APP_LINKS.discord; d.style.display = "block";
  }

  renderInspirations();
  renderPlans();
  setMode("photo");
  routeFromHash();
  window.addEventListener("hashchange", routeFromHash);
  refreshProfile();
})();

sb.auth.onAuthStateChange((_e, session) => { if (session) state.session = session; });

async function logout() { await sb.auth.signOut(); window.location.href = "index.html"; }

/* ---------- Crédits et formule ---------- */
async function refreshProfile() {
  const { data } = await sb.from("profiles").select("credits, plan").eq("id", state.user.id).single();
  if (!data) return;
  document.getElementById("credits").textContent = data.credits;
  document.getElementById("plan-name").textContent = data.plan || "Gratuit";
  state.credits = data.credits;
}

/* ---------- Navigation Studio / Historique / Invite ---------- */
function routeFromHash() {
  const view = (location.hash || "#studio").slice(1);
  ["studio", "historique", "invite"].forEach((v) => {
    document.getElementById("view-" + v).hidden = v !== view;
  });
  document.querySelectorAll(".side-nav a[data-view]").forEach((a) => a.classList.toggle("active", a.dataset.view === view));
  document.getElementById("sidebar").classList.remove("open");
  if (view === "historique") loadHistory();
}

/* ---------- Mode photo / vidéo ---------- */
function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  document.getElementById("ref-panel").hidden = mode === "video";
  const cost = COSTS[mode];
  document.getElementById("cost-line").textContent =
    `Coût : ${cost} crédit${cost > 1 ? "s" : ""} — ${mode === "video" ? "vidéo à partir de ta photo" : "retouche de ta photo"}`;
  document.getElementById("gen-btn").textContent = mode === "video" ? "Générer ma vidéo" : "Générer ma photo";
}

/* ---------- Import des photos ---------- */
function pickFile(e, slot) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) return alert("Image trop lourde (10 Mo max).");
  state.files[slot] = file;
  const img = document.getElementById(slot + "-preview");
  img.src = URL.createObjectURL(file);
  img.hidden = false;
  document.getElementById(slot + "-empty").hidden = true;
}

async function uploadFile(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${state.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from("uploads").upload(path, file, { contentType: file.type });
  if (error) throw new Error("Échec de l'envoi de la photo : " + error.message);
  return sb.storage.from("uploads").getPublicUrl(path).data.publicUrl;
}

/* ---------- Inspirations (config.js) ---------- */
function renderInspirations() {
  const grid = document.getElementById("inspi-grid");
  grid.innerHTML = INSPIRATIONS.map((it, i) => `
    <button class="inspi" type="button" data-i="${i}">
      ${it.image ? `<img src="${it.image}" alt="">` : `<div class="ph">IMAGE ${i + 1}</div>`}
      <span>${it.prompt}</span>
    </button>`).join("");
  grid.querySelectorAll(".inspi").forEach((b) =>
    b.addEventListener("click", () => { document.getElementById("prompt").value = INSPIRATIONS[b.dataset.i].prompt; }));
}

/* ---------- Génération ---------- */
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + state.session.access_token, ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function generate() {
  const prompt = document.getElementById("prompt").value.trim();
  if (!state.files.main) return alert("Importe d'abord ta photo.");
  if (prompt.length < 3) return alert("Décris la modification que tu veux.");
  if ((state.credits ?? 0) < COSTS[state.mode]) {
    return openPlans("Tu n'as plus assez de crédits. Choisis une formule pour continuer.");
  }

  const btn = document.getElementById("gen-btn");
  btn.disabled = true;
  showResult("Envoi de ta photo…");
  try {
    const urls = [await uploadFile(state.files.main)];
    if (state.mode === "photo" && state.files.ref) urls.push(await uploadFile(state.files.ref));

    showResult("Génération en cours… (environ 30 secondes pour une photo, plusieurs minutes pour une vidéo)");
    const { status, body } = await api("/api/generate", { method: "POST", body: JSON.stringify({ mode: state.mode, prompt, imageUrls: urls }) });
    if (status === 402) { showResult(""); return openPlans("Tu n'as plus assez de crédits. Choisis une formule pour continuer."); }
    if (status !== 200) throw new Error(body.error || "Erreur pendant la génération.");
    refreshProfile();
    await pollStatus(body.id);
  } catch (err) {
    showResult("❌ " + err.message);
  } finally {
    btn.disabled = false;
  }
}

async function pollStatus(id) {
  const started = Date.now();
  while (Date.now() - started < 15 * 60 * 1000) {
    await new Promise((r) => setTimeout(r, 3000));
    const { body } = await api("/api/status?id=" + encodeURIComponent(id));
    if (body.status === "success") return showMedia(body.result_url, body.mode);
    if (body.status === "failed") { refreshProfile(); return showResult("❌ La génération a échoué. Ton crédit t'a été rendu."); }
  }
  showResult("La génération prend plus de temps que prévu. Elle apparaîtra dans ton historique.");
}

function showResult(text) {
  const box = document.getElementById("result");
  box.hidden = !text;
  document.getElementById("result-status").textContent = text;
  document.getElementById("result-media").innerHTML = "";
}

function showMedia(url, mode) {
  showResult("✅ Terminé !");
  document.getElementById("result-media").innerHTML =
    (mode === "video" ? `<video src="${url}" controls playsinline></video>` : `<img src="${url}" alt="Résultat">`) +
    `<a class="btn btn-ghost btn-block" href="${url}" target="_blank" rel="noopener" download>Télécharger</a>`;
}

/* ---------- Historique ---------- */
async function loadHistory() {
  const grid = document.getElementById("history-grid");
  grid.innerHTML = "<p class='hint'>Chargement…</p>";
  const { data } = await sb.from("generations").select("mode, prompt, status, result_url, created_at")
    .eq("user_id", state.user.id).order("created_at", { ascending: false }).limit(100);
  if (!data || !data.length) return (grid.innerHTML = "<p class='hint'>Aucune création pour l'instant.</p>");
  grid.innerHTML = data.map((g) => `
    <div class="history-item">
      ${g.status === "success" ? (g.mode === "video" ? `<video src="${g.result_url}" controls></video>` : `<a href="${g.result_url}" target="_blank" rel="noopener"><img src="${g.result_url}" alt=""></a>`) : `<div class="ph" style="height:180px;border-radius:0">${g.status === "failed" ? "Échec" : "En cours…"}</div>`}
      <p>${new Date(g.created_at).toLocaleDateString("fr-FR")} · ${escapeHtml(g.prompt).slice(0, 80)}</p>
    </div>`).join("");
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }

/* ---------- Fenêtre d'abonnement ---------- */
function openPlans(message) {
  document.getElementById("modal-msg").textContent = message || "Sans engagement · résiliable à tout moment";
  document.getElementById("plans-modal").hidden = false;
}
function closePlans() { document.getElementById("plans-modal").hidden = true; }

function setPeriod(period) {
  state.period = period;
  document.querySelectorAll("#modal-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.period === period));
  renderPlans();
}

function renderPlans() {
  const yearly = state.period === "yearly";
  document.getElementById("modal-plans").innerHTML = PLANS.map((p) => `
    <div class="plan ${p.badge ? "featured" : ""}">
      ${p.badge ? `<span class="pill">${p.badge}</span>` : ""}
      <h3>${p.name}</h3>
      ${!yearly && p.oldMonthly ? `<div class="old">${p.oldMonthly}</div>` : ""}
      <div class="price">${yearly ? p.yearlyPrice : p.monthlyPrice}<small> ${yearly ? "/an" : "/mois"}</small></div>
      <div class="billed">${yearly ? `Prélevé en une fois, soit ${p.yearlyEquivalent}/mois` : "Prélevé chaque mois"}</div>
      <div class="allow">${p.photosPerMonth} <small style="color:var(--muted);font-weight:500">/mois</small></div>
      <ul>${p.perks.map((x) => `<li>${x}</li>`).join("")}</ul>
      <a class="btn ${p.badge ? "btn-primary" : "btn-ghost"} btn-block" href="${yearly ? p.whopYearly : p.whopMonthly}" target="_blank" rel="noopener">Choisir ${p.name}</a>
    </div>`).join("");
}

document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePlans(); });

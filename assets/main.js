/* =========================================================
   MAIN.JS — header, footer et petites animations du site.
   Tes infos (nom, email, formules…) sont dans assets/config.js
   ========================================================= */

/* ---------- Header commun à toutes les pages ---------- */
function renderHeader() {
  const el = document.getElementById("header");
  if (!el) return;
  el.innerHTML = `
  <header class="header">
    <div class="container">
      <a href="index.html" class="logo"><span>${SITE.name}</span></a>
      <button class="burger" aria-label="Ouvrir le menu" onclick="document.querySelector('.nav').classList.toggle('open')">☰</button>
      <nav class="nav">
        <a href="index.html#fonctionnalites">Fonctionnalités</a>
        <a href="tarifs.html">Tarifs</a>
        <a href="index.html#faq">FAQ</a>
        <span class="lang">FR</span>
        <a href="connexion.html">Connexion</a>
        <a href="inscription.html" class="btn btn-primary">Démarrer maintenant</a>
      </nav>
    </div>
  </header>`;
}

/* ---------- Footer commun à toutes les pages ---------- */
function renderFooter() {
  const el = document.getElementById("footer");
  if (!el) return;
  el.innerHTML = `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="index.html" class="logo"><span>${SITE.name}</span></a>
          <p style="color:var(--muted);font-size:14px;margin-top:10px;max-width:320px">
            [Courte phrase de présentation de ton service — à modifier dans assets/main.js]
          </p>
        </div>
        <div>
          <h4>LÉGAL</h4>
          <a href="mentions-legales.html">Mentions légales</a>
          <a href="cgv.html">CGU / CGV</a>
          <a href="confidentialite.html">Confidentialité</a>
        </div>
        <div>
          <h4>CONTACT</h4>
          <a href="mailto:${SITE.email}">${SITE.email}</a>
          <a href="tarifs.html">Tarifs</a>
          <a href="exemples.html">Exemples</a>
        </div>
      </div>
      <p class="copy">© ${SITE.year} ${SITE.name}. Tous droits réservés.</p>
    </div>
  </footer>`;
}

/* ---------- Remplace [data-site] par les infos de config ---------- */
function fillSiteData() {
  document.querySelectorAll("[data-site]").forEach((n) => {
    const key = n.getAttribute("data-site");
    if (SITE[key] !== undefined) n.textContent = SITE[key];
  });
  document.title = document.title.replace("[NOM DU SITE]", SITE.name);
}

/* ---------- FAQ (accordéon) ---------- */
function initFaq() {
  document.querySelectorAll(".faq-q").forEach((q) => {
    q.addEventListener("click", () => q.parentElement.classList.toggle("open"));
  });
}

/* ---------- Avis : duplique les cartes pour un défilement continu ---------- */
function initMarquee() {
  document.querySelectorAll(".marquee").forEach((m) => {
    m.innerHTML += m.innerHTML;
  });
}

/* ---------- Tarifs : bascule mensuel / annuel ---------- */
function initBilling() {
  const buttons = document.querySelectorAll(".billing-toggle button");
  if (!buttons.length) return;
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      buttons.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      const mode = b.dataset.mode; // "monthly" ou "yearly"
      document.querySelectorAll(".plan").forEach((p) => {
        p.querySelector(".price").innerHTML = p.dataset[mode + "Price"];
        p.querySelector(".billed").textContent = p.dataset[mode + "Billed"];
      });
    })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  fillSiteData();
  initFaq();
  initMarquee();
  initBilling();
});

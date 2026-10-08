# Ton SaaS — mode d'emploi complet

## Ce qu'il y a dans le dossier
| Fichier | Rôle |
|---|---|
| index.html, tarifs.html, exemples.html | Vitrine |
| connexion.html, inscription.html | Comptes (email + Google) |
| **app.html** | L'outil : photo/vidéo, crédits, historique, fenêtre d'abonnement |
| mentions-legales.html, cgv.html, confidentialite.html | Pages légales |
| **assets/config.js** | ⭐ TOUT ce que tu modifies : nom, email, clés publiques, formules, liens Whop, images d'inspiration |
| assets/style.css, assets/app.css | Couleurs et design |
| api/_config.js | Réglages serveur : modèles IA, crédits donnés par paiement Whop |
| api/generate.js, api/status.js, api/whop-webhook.js | Fonctions serveur (ne pas toucher) |
| supabase/schema.sql | La base de données (à coller une fois dans Supabase) |

---

## Modifier le contenu (sans coder)
- **Nom / email** → `assets/config.js`, tout en haut (+ `[NOM DU SITE]` dans les balises `<title>`).
- **Images de la vitrine** → remplace chaque `<div class="ph">IMAGE X…</div>` par `<img src="images/ton-image.jpg" alt="…">` (crée un dossier `images/`).
- **Images "Inspirations" de l'app** → `assets/config.js`, liste `INSPIRATIONS` : mets le chemin de l'image entre les guillemets.
- **Formules, prix, avantages** → `assets/config.js`, liste `PLANS`.
- **Couleurs** → haut de `assets/style.css` (`--accent`, `--accent-2`).

---

## Mise en route (dans cet ordre)

### 1. Supabase (comptes + base de données)
1. Crée un compte sur supabase.com → **New project** (région : Europe).
2. **SQL Editor → New query** → colle tout le fichier `supabase/schema.sql` → **Run**.
3. **Project Settings → API** : copie
   - `Project URL` et la clé `anon public` → dans `assets/config.js` (bloc `SUPABASE`)
   - la clé `service_role` → **uniquement** dans Vercel (étape 4), jamais dans un fichier.
4. **Authentication → URL Configuration** :
   - Site URL : `https://tondomaine.fr`
   - Redirect URLs : ajoute `https://tondomaine.fr/app.html` (et ton adresse `.vercel.app/app.html` pour tester).

### 2. Connexion Google
1. console.cloud.google.com → crée un projet → **APIs & Services → OAuth consent screen** (externe, nom du site, ton email).
2. **Credentials → Create credentials → OAuth client ID** → type *Web application*.
3. Dans "Authorized redirect URIs", colle l'adresse que Supabase affiche dans **Authentication → Providers → Google** (elle finit par `/auth/v1/callback`).
4. Copie le *Client ID* et le *Client secret* dans Supabase → Providers → Google → **Enable**.

### 3. kie.ai (l'IA)
1. Crée un compte sur kie.ai, recharge quelques euros de crédits.
2. Copie ta **clé API** (elle ira dans Vercel).
3. Pour la vidéo : choisis un modèle "image to video" sur docs.kie.ai et note son nom exact (variable `KIE_VIDEO_MODEL`). Sans ça, le bouton vidéo affiche "pas encore activée".
4. Mets un **plafond de dépenses** sur ton compte kie.ai.

### 4. Vercel (mise en ligne)
1. Mets tout le dossier sur GitHub (contenu du dossier, `index.html` à la racine).
2. Vercel → **Add New → Project** → ton repository → **Deploy**.
3. **Settings → Environment Variables**, ajoute :
   | Nom | Valeur |
   |---|---|
   | `SUPABASE_URL` | ton Project URL Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | ta clé service_role |
   | `KIE_API_KEY` | ta clé kie.ai |
   | `KIE_VIDEO_MODEL` | nom du modèle vidéo (optionnel) |
   | `WHOP_WEBHOOK_SECRET` | un mot de passe long que tu inventes (ex : 30 caractères au hasard) |
4. **Deployments → Redeploy** pour que les variables soient prises en compte.

✅ À ce stade, tu peux tester : inscription, 1 crédit offert, génération d'une photo.

### 5. Whop (paiements)
1. Crée ton compte Whop → crée un produit avec **6 formules** (Découverte / Pro / Ultimate, en mensuel et en annuel), aux **mêmes prix** que `assets/config.js`.
2. Copie le **lien de paiement** de chaque formule → `assets/config.js` (`whopMonthly` / `whopYearly`).
3. Copie l'**ID de chaque formule** (`plan_…`) → `api/_config.js` (`WHOP_PLANS`), avec le nombre de crédits à donner.
4. Whop → **Developer → Webhooks** → ajoute l'adresse :
   `https://tondomaine.fr/api/whop-webhook?secret=TON_WHOP_WEBHOOK_SECRET`
   et coche l'événement **payment succeeded**.
5. Fais un vrai paiement test avec ta carte (même email que ton compte), vérifie que les crédits arrivent, puis rembourse-toi depuis Whop.
   Si les crédits n'arrivent pas : Vercel → ton projet → **Logs** → cherche "Whop webhook reçu" et envoie-moi ce qui s'affiche.

---

## Travailler à deux
- GitHub : Settings → Collaborators → invite ton associé.
- Supabase : Organization → Team → invite (gratuit).
- Whop : Settings → Team.
- Vercel Pro : 2e siège à 20 $/mois s'il doit publier lui-même, sinon accès "Viewer" gratuit.

## À savoir
- Les images générées par kie.ai sont gardées 14 jours chez eux : pense à télécharger celles que tu veux garder.
- Le client doit payer avec **la même adresse email** que son compte pour recevoir ses crédits automatiquement (c'est écrit dans la fenêtre d'abonnement).
- En annuel, les crédits des 12 mois sont ajoutés d'un coup.
- Le parrainage ("Invite et gagne") sera branché à l'étape 3.
- Fais relire les CGV et ajoute un médiateur de la consommation avant de vendre.

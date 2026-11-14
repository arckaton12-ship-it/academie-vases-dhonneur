# PLAN DE RELANCE — Académie Vases d'Honneur

> Objectif : repartir d'une base saine, fiabiliser l'existant, puis offrir une
> expérience d'ouverture premium (type configuration Apple) et une interface
> glassmorphism cohérente, sans refonte totale.

Dernière mise à jour : 2026-11-14
Branche de travail : `git-rattrapage` (identique à `main` au démarrage)

---

## 1. Diagnostic de départ (vérifié)

| Point | État constaté |
|---|---|
| Tests unitaires | 3 fichiers, 56 tests, tous verts |
| Intégration continue | absente (aucun workflow) |
| Build | Vite + TypeScript, sortie `dist/` |
| Dashboards monolithiques | Admin 3017 l., Student 2133 l., Moderator 1686 l., AdminClasse 1399 l. |
| Migrations SQL | 93 fichiers, pas de schéma de référence |
| Auth | lecture du JWT dans `localStorage`, délais 8 s / 10 s, bouton de réinitialisation totale |
| Documentation | README obsolète (4 migrations annoncées), rapports non versionnés |
| Secrets | `.env` ignoré, mais clé de service Firebase présente **dans le dossier** du projet |
| Copies concurrentes | `Downloads/academie-vh`, `vase-dhonneur-v5`, `vase-honneur-pwa-corrige`, `OneDrive/VASE D'HONNEUR FINAL LAPS` |
| Rythme | dernier commit le 2026-09-08 |

---

## 2. Chantiers et ordre d'exécution

### Chantier 0 — Plan et gouvernance
- [x] Écrire ce plan dans le dépôt.
- [ ] Une branche par chantier, message de commit explicite (convention déjà en place).
- [ ] Étiquette `v1.0.0` une fois les chantiers 1 à 4 terminés.

### Chantier 1 — Filet de sécurité (CI)
- [x] Workflow GitHub Actions : `npm ci`, `npm run build`, `npm test` sur chaque push et pull request.
- [x] Conserver les tests comme référence de non-régression (81 tests après ajout des tests de session et de couverture des semaines).
- [x] Ajouter les tests des composants critiques au fil des découpages (session, couverture des semaines, date).
- Critère d'acceptation : un push cassé est bloqué automatiquement.

### Chantier 2 — hygiène et sécurité du dépôt
- [x] Sortir la clé de service Firebase du dossier du projet et la ranger hors dépôt
      (`C:\Users\Elite X2\.secrets\academie-vases-dhonneur\`).
- [x] Documenter la rotation obligatoire de cette clé (elle a séjourné sur le poste).
- [x] Mettre le README à jour : état réel, 93 migrations, commandes exactes.
- [ ] Archiver les copies concurrentes (Téléchargements / OneDrive) et désigner la source unique de vérité.
- Critère d'acceptation : un nouveau développeur installe et lance le projet en suivant uniquement le README.

### Chantier 3 — Découpage des dashboards
- [x] `StudentDashboard.tsx` 2133 → 280 l. ; 8 onglets sous `src/components/student/tabs/`, état dans `src/pages/student/useStudentDashboardState.ts`.
- [x] `AdminDashboard.tsx` 3017 → 119 l. ; 14 sections sous `src/components/admin/sections/`, état dans `src/pages/admin/useAdminDashboardState.ts`.
- [x] `ModeratorDashboard.tsx` 1686 → 298 l. ; 8 composants sous `src/components/moderator/`.
- [x] `AdminClasseDashboard.tsx` 1399 → 274 l. ; 9 composants sous `src/components/admin-classe/`.
- Règle : extraction à comportement strictement identique, aucun changement fonctionnel dans le même commit.
- Critère d'acceptation : aucun fichier de page au-dessus de 600 lignes, tests et build verts à chaque étape. **Atteint** : la plus grosse page fait 346 lignes et le plus gros composant extrait 424 lignes.

### Chantier 4 — Authentification robuste
- [ ] Comprendre la cause du blocage du refresh token Supabase (rotation, onglets multiples, réseau).
- [ ] Centraliser la session dans une seule couche avec délai court et état d'erreur explicite.
- [ ] Supprimer progressivement les filets 8 s / 10 s et le bouton de réinitialisation totale.
- [ ] Tester les cas : token expiré, réseau coupé, double onglet, retour arrière.
- Critère d'acceptation : plus de chargement infini possible, message clair en cas d'échec.

### Chantier 5 — Base de données maîtrisable
- [ ] Générer un schéma de référence (`supabase/baseline.sql`) à partir de l'état réel.
- [x] Garder les migrations comme historique, mais documenter la procédure de reconstruction (README).
- [x] Script de contrôle : ordre, doublons, migrations non appliquées
      (`tools/check-migrations.mjs`, intégré à la CI, anomalies historiques listées).
- [ ] Exécuter les tests RLS existants sur un projet Supabase de test.
- Critère d'acceptation : reconstruction complète d'une base neuve en une commande documentée.

### Chantier 6 — Qualité des données et produit
- [x] Détecter les semaines sans cours par classe et alerter l'administration
      (`src/lib/weekCoverage.ts`, 13 tests dans `src/lib/weekCoverage.test.ts`).
- [x] Afficher l'alerte dans le tableau de bord administrateur (section « Vue » : semaines couvertes, trous et doublons par classe).
- [ ] Mesurer l'usage réel des onglets avant toute nouvelle fonctionnalité.
- [ ] Corriger l'anomalie réelle constatée le 2026-11-13 : Classe 2 possède
      **15 cours pour 14 semaines** (semaine 5 en double). Le « trou de la
      semaine 3 » annoncé initialement n'existe plus. Toute suppression de
      doublon attend la confirmation de l'administration.
- Critère d'acceptation : aucune classe ne peut « sauter » une semaine sans signe visible.

### Chantier 7 — Relance visuelle : ouverture cinématique et glassmorphism
Demande explicite : expérience d'ouverture façon « déballage / configuration Apple »
pour un nouvel utilisateur, et verre flouté transparent partout, sans refonte totale.

- [x] **Séquence d'ouverture cinématique** (`SplashScreen`) : fond aurora animé, carte de verre qui monte, logo qui s'illumine, balayage de lumière, nom de l'académie, ligne de progression, sortie par levée de rideau. Durée 3 à 4 s, saut possible au clic, respect de `prefers-reduced-motion`, une seule fois par session.
- [x] **Accueil du nouvel utilisateur** (`WelcomeAnimation`) : parcours en trois temps très courts (bienvenue, prénom, premiers repères), sur cartes de verre, avec bouton « Commencer » et bouton « Passer ».
- [x] **Système de verre unifié** dans `src/styles/globals.css` : `.glass-panel`, `.glass-card`, `.glass-nav`, `.glass-pill`, `.glass-input`, `.glass-sheet`, bord lumineux, reflet spéculaire, ombre douce, variantes clair et sombre.
- [x] **Application progressive** : landing, écrans d'authentification, barres latérales et supérieures, cartes de statistiques, onglets, modales, tiroirs et notifications (verre posé sur les composants partagés, donc hérité par les quatre dashboards).
- [x] **Fond vivant** : dégradé maillé discret et aurora lente derrière les surfaces de verre, désactivable en mode économie.
- [x] Contraste et lisibilité vérifiés : Lighthouse accessibilité 100/100 sur l'accueil et la connexion ; combinaisons or sur or/texte corrigées et nouvelle encre `encre` pour le texte posé sur l'or. Les écrans authentifiés héritent des mêmes jetons mais restent à re-auditer avec un compte réel.
- [x] `robots.txt` valide, zoom navigateur réautorisé (suppression de `user-scalable=no`).
- Critère d'acceptation : aucune surface pleine opaque sur les écrans principaux, rendu cohérent en clair et en sombre, animation fluide sur mobile.

---

## 3. Definition of Done globale

1. `npm run build` et `npm test` verts.
2. Aucun secret dans le dossier du projet.
3. Documentation à jour et source unique de vérité clairement désignée.
4. Aucune page au-dessus de 600 lignes.
5. Ouverture cinématique et glassmorphism actifs, testés en clair, en sombre et sur mobile.
6. Un utilisateur nouveau peut s'inscrire, comprendre l'application et suivre son premier cours sans aide.

---

## 4. Journal d'exécution

| Date | Chantier | Résultat |
|---|---|---|
| 2026-11-13 | 0 | Plan écrit dans le dépôt |
| 2026-11-13 | 1 | Workflow CI créé (Node 22, `npm ci`, build, tests, artefact `dist`) |
| 2026-11-13 | 2 | Clé Firebase déplacée hors dépôt ; README réécrit (93 migrations, commandes, sécurité) |
| 2026-11-13 | 3 | Admin : 5 composants extraits (−1044 l.) ; Student : 3 composants + dates extraits (−145 l.) ; Moderator 1686 → 298 l. ; AdminClasse 1399 → 274 l. |
| 2026-11-13 | 4 | Couche session unique (`src/lib/session.ts`), délai de rôle 6 s, écran « Réessayer / Se reconnecter », bouton de réinitialisation corrigé |
| 2026-11-13 | 6 | Audit base réel : Classe 1 (15 cours, 1–15), Classe 2 (15 cours, 1–14, **semaine 5 en double**), Classe 3 (13 cours, 1–13), Graduation (0 cours, attendu). Aucune semaine manquante. |
| 2026-11-13 | 7 | Splash cinématique, onboarding 3 étapes, système de verre unifié, fond aurora, application landing/auth/étudiant/composants partagés |
| 2026-11-14 | 3 | Découpages terminés et réparés : Admin 119 l., Student 280 l., Moderator 298 l., AdminClasse 274 l. ; plus gros composant extrait 424 l. |
| 2026-11-14 | 6 | Alerte de couverture des semaines branchée dans la section « Vue » de l'administration |
| 2026-11-14 | 7 | Audit Lighthouse : accessibilité 100/100 sur l'accueil et la connexion ; or sur or corrigé (`encre`, `or-texte`), `robots.txt`, zoom mobile réautorisé |
| 2026-11-14 | — | Vérifications finales : `tsc` vert, `npm test` 81/81, `npm run check:migrations` sans anomalie nouvelle, `npm run build` vert, page d'accueil chargée sans erreur applicative (seules les ressources externes sont bloquées par le réseau du navigateur de test) |
| 2026-11-14 | 5 | Conversion et confiance : CTA « Commencer maintenant » et « Je m'inscris maintenant » vers `/etudiant/inscription`, lien « Déjà inscrit ? Se connecter », parcours mot de passe oublié (`/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`), tarification clarifiée (inscription gratuite, contribution unique de 10 000 F pour le kit), faux témoignages remplacés par « Ton parcours, en trois classes », pages `/contact`, `/mentions-legales` et 404 en verre, `/test-sentry` réservé au développement |
| 2026-11-14 | 6 | Mobile et finition : suppression des `!important` globaux (cibles tactiles limitées aux contrôles), menu mobile intégré aux quatre en-têtes via l'événement `academie:open-mobile-sidebar`, tiroir en `role="dialog"` avec safe-area, `prefers-reduced-motion` consolidé en fin de feuille, repli opaque quand `backdrop-filter` manque, couleur inexistante `text-terre` corrigée, raccourci Messages vers `?tab=messagerie` |
| 2026-11-14 | 3 | Performance : `React.lazy` + `Suspense` sur les quatre tableaux de bord, `jspdf` et `jspdf-autotable` importés dynamiquement, façade cliquable pour la vidéo YouTube, `manualChunks` react/supabase/sentry. Bundle d'entrée 1 546 kB (447 kB gzip) → 91,88 kB (25,98 kB gzip), plus d'avertissement de chunk |
| 2026-11-14 | 6 | Alerte de couverture des semaines rendue actionnable : bouton « Corriger le planning des cours » et message cliquable vers la section Cours de l'administration |
| 2026-11-14 | 1 | Suite de tests scindée : `npm test` ne lance que les tests hors ligne (43/43 en 2 s), `npm run test:api` réserve la campagne réseau Supabase (`tests/api.test.ts`) aux postes connectés |
| 2026-11-14 | 7 | Lighthouse local : accueil et connexion à 100 en accessibilité, bonnes pratiques et SEO ; pages publiques, 404 et états du lien de réinitialisation vérifiés sans erreur console |

# Académie Vases d'Honneur

Application web de l'Académie biblique de l'Église Vases d'Honneur (Assemblée
Eaux Paisibles de Yaoundé) : parcours de formation en trois niveaux, cours
hebdomadaires, devoirs, suivi par les modérateurs, badges et certificats.

**Source unique de vérité** : ce dépôt. Les copies présentes ailleurs sur les
postes (`Téléchargements`, `OneDrive`, etc.) ne doivent plus être modifiées.

## Pile technique

- **Frontend** : React 18 + TypeScript, Vite 5, Tailwind CSS 3
- **Backend** : Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Tests** : Vitest (unitaires), Playwright (parcours manuels dans `tests/`)
- **Notifications** : Firebase Cloud Messaging (optionnel)
- **Erreurs** : Sentry (optionnel)
- **CI** : GitHub Actions (`.github/workflows/ci.yml`)

## Démarrage rapide

Prérequis : Node.js 22 et npm.

```bash
npm install
cp .env.example .env      # puis renseigner les valeurs
npm run dev               # http://localhost:5173
```

Variables d'environnement attendues (voir `.env.example`) :

| Variable | Rôle |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase, sans `/rest/v1/` |
| `VITE_SUPABASE_ANON_KEY` | Clé publique `anon` |
| `VITE_GOOGLE_SHEETS_URL` | Webhook d'export Google Sheets (optionnel) |
| `VITE_SENTRY_DSN` | DSN Sentry (optionnel) |
| `SUPABASE_SERVICE_ROLE` | Usage local des scripts de test uniquement — jamais côté client |
| `SUPABASE_MANAGEMENT_TOKEN` | Usage local des scripts d'administration uniquement |

Toute clé `service_role` ou tout fichier `*firebase-adminsdk*.json` reste
**hors du dépôt**. En cas de fuite suspectée, la clé doit être révoquée puis
régénérée dans la console Supabase / Firebase.

## Base de données

Le dossier `supabase/migrations/` contient **93 migrations SQL** numérotées de
`001` à `093`. Elles constituent l'historique complet du schéma (tables,
fonctions, triggers, politiques RLS, correctifs).

Procédure recommandée pour une base neuve :

1. Créer un projet Supabase vide.
2. Appliquer les migrations **dans l'ordre numérique** :

   ```bash
   # avec la CLI Supabase
   supabase link --project-ref <ref>
   supabase db push
   ```

   ou, sans CLI, exécuter chaque fichier dans l'éditeur SQL du tableau de bord,
   en respectant strictement l'ordre.

3. Créer un bucket Storage public en lecture nommé `cours`
   (audio, vidéo, supports de cours).
4. Dans Auth, désactiver la confirmation e-mail
   (`mailer_autoconfirm` → activé) pour un parcours d'inscription instantané.
5. Vérifier les politiques RLS avec les migrations `089` et suivantes.

Les migrations sont idempotentes pour la plupart, mais l'ordre fait foi.
`supabase/baseline.sql` n'existe pas encore : la reconstruction s'appuie sur la
séquence de migrations.

Anomalies historiques connues, acceptées par `npm run check:migrations` et à
résorber lors de la création du baseline : numéros `027`, `051`, `052`, `072`,
`087` et `088` en double, fichiers suffixés `027b`, `027c`, `072b`, et plage
`032` à `039` absente. Toute nouvelle anomalie fait échouer la CI.

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification TypeScript puis build de production dans `dist/` |
| `npm run preview` | Prévisualisation du build |
| `npm test` | Tests unitaires Vitest |
| `npm run test:watch` | Tests en mode surveillance |
| `npm run check:migrations` | Vérifie l'ordre et les doublons des migrations |

La CI exécute `npm ci`, `npm run build` puis `npm test` sur chaque push et
chaque pull request. Un build cassé bloque la fusion.

## Rôles et routes

| Rôle | Connexion | Tableau de bord |
|---|---|---|
| Étudiant | `/etudiant/connexion` | `/etudiant/tableau-de-bord` |
| Modérateur | `/moderateur/connexion` | `/moderateur/tableau-de-bord` |
| Administrateur | `/admin/connexion` | `/admin/tableau-de-bord` |
| Admin de classe | `/admin-classe/connexion` | `/admin-classe/tableau-de-bord` |

Le composant `RequireRole` vérifie le rôle, le statut actif et l'obligation de
changer le mot de passe. La session est lue de façon synchrone dans
`localStorage` via `src/lib/session.ts` : aucun appel réseau ne peut bloquer
l'interface indéfiniment.

## Organisation du code

```
src/
  components/      composants partagés (verre, badges, quiz, messagerie…)
    admin/         sections extraites du tableau de bord administrateur
    student/       sections extraites du tableau de bord étudiant
    moderator/     sections extraites du tableau de bord modérateur
    admin-classe/  sections extraites du tableau de bord admin de classe
  lib/             accès Supabase, règles métier, utilitaires testables
  pages/           pages et tableaux de bord
  styles/          Tailwind et design system (glassmorphism, animations)
supabase/
  migrations/      93 migrations SQL ordonnées
tests/             scripts d'audit et scénarios Playwright
```

## Expérience visuelle

- **Ouverture cinématique** (`SplashScreen`) : fond aurora, carte de verre,
  logo lumineux, balayage de lumière, barre de progression, sortie par levée de
  rideau. Une fois par session, saut possible au clic, respect de
  `prefers-reduced-motion`.
- **Accueil du nouvel utilisateur** (`WelcomeAnimation`) : trois étapes courtes
  sur cartes de verre, avec bouton « Passer ».
- **Glassmorphism** : classes `.glass-panel`, `.glass-card`, `.glass-nav`,
  `.glass-pill`, `.glass-input`, `.glass-sheet`, `.glass-scrim` définies dans
  `src/styles/globals.css`, en clair comme en sombre.
- **Fond vivant** : dégradés maillés discrets derrière les surfaces de verre.

## Contrôles et documentation

- `PLAN_RELANCE.md` : plan de relance, chantiers et journal d'exécution.
- `ARCHITECTURE.md` : notes d'architecture (document de travail local).
- `tests/week-audit.cjs` : audit de cohérence des semaines par classe.
- `src/lib/weekCoverage.ts` : détection des semaines manquantes ou en double,
  couverte par `src/lib/weekCoverage.test.ts`.

## État connu

- Les tableaux de bord historiques sont en cours de découpage ; l'objectif est
  qu'aucune page ne dépasse 600 lignes.
- La détection des semaines sans cours est disponible côté code ; son affichage
  dans l'administration reste à brancher.
- La clé de service Firebase a été déplacée hors du dépôt et doit être
  régénérée (rotation de sécurité).

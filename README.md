# Académie Vases d'Honneur — MVP

Généré en dehors de Dyad pour tenir le délai de dimanche. Structure : Vite + React + TypeScript + Tailwind, Supabase (auth + DB + storage).

## Pour OpenCode : étapes d'intégration

1. `npm install`
2. Copier `.env.example` en `.env`, renseigner `VITE_SUPABASE_URL` (sans suffixe `/rest/v1/`, ex. `https://xxxx.supabase.co`) et `VITE_SUPABASE_ANON_KEY`.
3. Exécuter les migrations dans l'ordre sur le projet Supabase (SQL Editor ou `supabase db push`) :
   - `supabase/migrations/001_init_schema.sql` (schéma complet + fonction RLS `is_admin_or_moderator`)
   - `supabase/migrations/002_fix_rls_and_missing_tables.sql` (idempotent)
   - `supabase/migrations/003_cleanup_dashboard_policies.sql` (remplace les policies récursives)
   - `supabase/migrations/004_storage_policies.sql` (grants + policies du bucket « cours »)
4. Créer un bucket Supabase Storage nommé `cours` (public en lecture, audio/vidéo).
5. Désactiver la confirmation email dans Auth (`mailer_autoconfirm` → on) pour un flow d'inscription instantané.
6. `npm run dev` pour lancer en local.

## Ce qui est fait
- Landing page (3 accès : étudiant, administration, modérateur), auth complète (inscription/connexion étudiant, admin, modérateur), création de profil en base.
- Dashboard étudiant : streak (signature visuelle dédiée), cours de la semaine avec **lecteurs audio/vidéo branchés sur le bucket « cours »** et lien de téléchargement, devoirs/exercices réels, tableau de progression.
- Dashboard admin : stats réelles (inscrits, soumissions, classes) + **export CSV/PDF fonctionnel** (suivi par classe, liste des étudiants).
- Écran modérateur `/moderateur/tableau-de-bord` : programme de modération (cours par classe, état audio/vidéo), **upload de cours** (fichiers → bucket « cours », metadata → table courses), **rapport** (suivi étudiant exportable CSV/PDF), **passage de classe** (changement de `class_id`).
- Protections de route par rôle (`RequireRole`) sur les trois dashboards.
- Palette et typographie validées : bordeaux #5D2A41, sable #D9B89E, olive #8A9A5B, parchemin #F8F4E9, or #CFAF5B, pierre #6B6B6B — Playfair Display (titres) + Source Sans 3 (corps) + IBM Plex Mono (données).

## Ce qu'il reste à faire
- Génération de certificats visuels et attribution automatique des badges.
- Saisie de notes/feedback par le modérateur sur les soumissions.
- Écran paramètres du profil branché sur la table profiles.

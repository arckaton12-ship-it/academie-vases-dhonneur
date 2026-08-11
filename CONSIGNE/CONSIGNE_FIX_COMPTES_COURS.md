# CONSIGNE — CORRECTION BUG CRITIQUE COMPTES + AFFICHAGE COURS

## 1. BUG CRITIQUE — admin_create_user cassé (priorité absolue)

Confirmé par ton propre audit : la migration 044 a cassé `admin_create_user` en générant un `gen_random_uuid()` pour `profiles.id` au lieu d'utiliser l'UUID réel retourné par la création du compte `auth.users`. Résultat : tout compte créé par l'admin depuis cette migration (modérateurs avec mot de passe temporaire, étudiants créés manuellement) a un profil orphelin, invisible et probablement incapable de se connecter.

Corrige dans cet ordre :

1. **Réécris `admin_create_user`** pour qu'elle :
   - Crée d'abord le compte dans `auth.users` (via l'API admin Supabase, avec le mot de passe temporaire généré)
   - Récupère l'UUID réellement généré par cette création
   - Insère ensuite dans `profiles` avec exactement ce même UUID comme `id`
   - Ne génère JAMAIS d'UUID indépendamment côté `profiles`

2. **Ajoute un trigger `handle_new_user` sur `auth.users`** (filet de sécurité) : à chaque insertion dans `auth.users` (que ce soit via inscription normale côté étudiant OU via création admin), un trigger crée automatiquement l'entrée correspondante dans `profiles` avec le même UUID si elle n'existe pas déjà. Ça protège contre tout futur échec silencieux de l'insert côté client (réseau, RLS, timeout — cause 2 de ton diagnostic).

3. **Audit et réparation des comptes existants déjà cassés** :
   - Liste tous les profils dans `profiles` dont l'`id` ne correspond à AUCUNE entrée dans `auth.users` (orphelins)
   - Liste tous les comptes `auth.users` créés récemment (depuis la migration 044) qui n'ont PAS d'entrée correspondante dans `profiles`
   - Pour les modérateurs concernés (Pasteur Mike, AP Alvine, AP Joël, AP Arnauld, AP Rebecca, AM Suzy, comptes admin@demo.test/mod@demo.test si créés via cette fonction cassée) : recrée-les proprement avec la fonction corrigée, ou répare le lien UUID directement si les données de profil existent déjà et sont correctes.
   - Rapporte la liste complète des comptes affectés et corrigés.

4. **Rafraîchissement de la liste étudiants côté admin** : ajoute un rafraîchissement automatique de la liste (Supabase Realtime sur `profiles`, ou au minimum un bouton "Actualiser" visible et un rechargement à chaque fois que l'onglet Étudiants redevient actif) — ne pas se contenter d'un chargement unique au montage du composant.

5. **Vérifie le filtre de classe** : confirme que quand aucun filtre de classe n'est sélectionné, TOUS les étudiants s'affichent, y compris ceux avec `class_id` NULL (ils doivent apparaître clairement identifiés comme "sans classe", pas juste disparaître du filtre par défaut).

Teste explicitement après correction : crée un nouveau modérateur depuis l'admin, confirme qu'il peut immédiatement se connecter avec le mot de passe temporaire affiché, et qu'il apparaît dans la liste admin sans rafraîchissement manuel de la base.

## 2. AFFICHAGE DES COURS SANS MÉDIA — CLARIFICATION DU MESSAGE

Confirmé : ce n'est pas un bug, c'est normal que la semaine de prise de contact n'ait pas de média. Corrige uniquement la formulation pour que ce soit clair pour l'étudiant que c'est intentionnel, pas cassé :

- Remplace le message actuel "Le contenu audio/vidéo de ce cours n'est pas encore disponible" par quelque chose de plus rassurant et cohérent avec le ton de l'app, par exemple : "Cette semaine est consacrée à la prise de contact — pas de cours audio/vidéo, profites-en pour lire le programme et faire connaissance avec ta classe." (adapter le texte selon le contexte du cours concerné — semaine de prise de contact vs un vrai cours qui aurait son média manquant par erreur, distingue les deux cas si possible plutôt qu'un message unique).

- Pour les cours qui ONT vraiment vocation à avoir un média (pas la semaine de prise de contact) mais où `audio_url`/`video_url` sont NULL : utilise les données du fichier `CONSIGNE/media_cours_academie.json` déjà fourni pour mapper les vraies URLs YouTube vers les cours correspondants — fais cette vérification et ce mapping maintenant plutôt que de laisser des cours réels sans contenu.

- **Attention particulière au Tronc Commun** : le fichier `media_cours_academie.json` contient une section `tronc_commun` séparée (4 cours : "La vision des églises Vases d'Honneur", "Servir Dieu", "La méditation de la Bible & la Bible", "L'Évangélisation") avec leurs médias. Comme il n'existe pas de concept `is_common` en base — ces 4 cours sont dupliqués avec le même titre dans les 3 classes (Classe 1, Classe 2, Classe 3) — assure-toi que **chacune des 3 occurrences** de ces 4 cours (donc 12 lignes au total dans `courses`, 4 par classe) reçoive bien les MÊMES médias issus de la section `tronc_commun` du JSON, pas seulement l'occurrence dans une seule classe. Vérifie explicitement, cours par cours et classe par classe, qu'aucune des 3 versions du Tronc Commun n'est restée sans média par oubli.

Rapporte : combien de cours ont un média après ce mapping, combien restent volontairement sans média (semaines de prise de contact/rattrapage/examen), et confirme qu'aucun vrai cours de contenu ne reste vide par erreur — en particulier confirme explicitement que les 12 occurrences du Tronc Commun (4 cours × 3 classes) ont bien leur média.

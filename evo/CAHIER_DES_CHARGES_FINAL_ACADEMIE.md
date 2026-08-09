# CAHIER DES CHARGES COMPLET — ACADÉMIE VASES D'HONNEUR
Document de référence final. Passe-le en revue intégralement avant d'exécuter. Fais un état des lieux fait/partiel/manquant si une version précédente du projet existe déjà, puis exécute ce qui manque.

---

## 0. IDENTITÉ VISUELLE OFFICIELLE (remplace toute palette précédente)

**Logo** : logo officiel de l'Académie fourni (toque de graduation + "academie" en cursive + bandeau "VASES D'HONNEUR"). Utilise ce logo tel quel partout où le logo apparaît (landing, dashboards, certificat).

**Palette officielle** (remplace bordeaux/sable/olive/parchemin/or/pierre) :
- **Teal profond** — `#1B6B63` (à ajuster si besoin par pipette exacte sur le fichier logo) : couleur principale, titres, navigation, boutons primaires
- **Or moutarde** — `#D4A017` : accents, streak, badges, éléments de valorisation
- **Rouge institutionnel** — `#A82A2E` : bandeau d'autorité, alertes, éléments liés à "Vases d'Honneur"
- **Fond** — blanc (`#FFFFFF`) partout, pas de fond crème/parchemin

**Typographie** : garder la structure Playfair Display (titres) / Source Sans 3 (corps) / IBM Plex Mono (données), adaptée aux nouvelles couleurs.

**Note** : une amélioration d'interface supplémentaire sera communiquée plus tard — laisser la structure de composants (Card, Button, etc.) modulaire pour faciliter cet ajout futur.

---

## 1. STRUCTURE COMMUNE À TOUS LES UTILISATEURS

- Landing page avec deux boutons d'entrée : **Accès Étudiant** et **Accès Administration**
- Bandeau de photos de profil défilant (Marquee, cf. section 8) sur la landing, entre le titre et les boutons
- Citation/verset du jour affiché en fondu sur la landing (sous le formulaire) et dans le header de **chaque page** de l'app (rotation quotidienne, banque de 30-40 citations)
- Lien connexion ↔ inscription visible dans les deux sens sur les pages d'auth
- Logo visible sur la landing et chaque dashboard
- Photo de profil (upload à l'inscription ou modifiable depuis les paramètres), avatar par défaut sobre si absente, cliquable → redirige vers Paramètres du profil
- Badge actif choisi par l'utilisateur affiché en médaillon sur le coin de l'avatar (cf. section 6)
- Déconnexion à tout moment
- Protection de route stricte par rôle

---

## 2. INSCRIPTION — FLUX EN DEUX ÉTAPES

**Étape 1 (rapide)** : email/téléphone, mot de passe, nom, prénom, photo optionnelle → création immédiate du compte + accès à l'app.

**Étape 2 (fiche complète, juste après)** : formulaire complet reprenant exactement les 29 champs du vrai formulaire d'inscription de l'Académie :

```
Horodateur, Adresse E-mail, NOMS, PRÉNOMS, PHOTO PORTRAIT EN COULEUR,
CONTACT TÉLÉPHONIQUE 1 (WhatsApp), CONTACT TÉLÉPHONIQUE 2 (Telegram),
CONTACTS TÉLÉPHONIQUES D'URGENCE (Ami/Parent), SEXE, CLASSES, TAILLE DE T-SHIRT,
Date d'Inscription, CANAL DE FORMATION, MODE DE PAIEMENT DE L'INSCRIPTION,
PROFESSION, QUARTIER DE RÉSIDENCE, DATE DE NAISSANCE, SITUATION MATRIMONIALE,
NOMBRE D'ENFANTS, ÊTES-VOUS BAPTISÉ PAR IMMERSION ?, DATE DE BAPTÊME,
DATE DE CONVERSION, DÉPARTEMENT DE SERVICE, TRIBU, TYPE D'ETUDIANT,
Capacité de lire le français, Capacité d'écoute du français,
Capacité d'écrire le français, ENGAGEMENT
```

Valeurs des listes déroulantes (observées dans les vraies données) :
- **CLASSES** : Connaître & Servir Christ / Croître avec Jésus / Consécration
- **SEXE** : Homme / Femme
- **CANAL DE FORMATION** : En Présentiel / En Ligne (avec autorisation)
- **SITUATION MATRIMONIALE** : Célibataire / Fiancé(e) / Marié(e) / Veuf/Veuve
- **TRIBU** : Lévi / Juda / Siméon / Ruben / Zabulon / Issacar / Dan / Nephtali / Gad / Aser / Manassé / Éphraïm / Benjamin / Aucune
- **DÉPARTEMENT DE SERVICE** : Intercession / Chantre / Communication / Accueil / Gestion des Cultes / Médecine d'Honneur / Portier / Évangélisation / Amis des Nouveaux (ADN) / Social / Aucun
- **TYPE D'ETUDIANT** : Nouveau / Ancien
- Capacités français (lecture/écoute/écriture) : Bon / Moyen / Faible
- **ENGAGEMENT** : case à cocher obligatoire (correspond à la lecture de la "ligne de conduite de l'étudiant")

**Ligne de conduite de l'étudiant** : à la première connexion, avant de valider l'inscription, afficher le règlement de l'Académie avec case à cocher "J'ai lu et j'accepte" (ENGAGEMENT).

**Table Supabase** `academy_registrations`, liée à `profiles` (student_id), colonnes dans l'ordre exact ci-dessus (mappé en anglais technique : email, last_name, first_name, photo_url, phone_whatsapp, phone_telegram, emergency_contact, sex, class_name, tshirt_size, registration_date, training_channel, payment_mode, profession, neighborhood, birth_date, marital_status, children_count, baptized_immersion, baptism_date, conversion_date, service_department, tribe, student_type, french_reading_level, french_listening_level, french_writing_level, commitment).

**Webhook vers Google Sheet** : à la soumission de l'étape 2, POST des données (dans l'ordre exact des colonnes) vers une URL Google Apps Script (URL à fournir séparément une fois déployée par l'utilisateur), en réutilisant le mécanisme webhook déjà existant dans le projet (`net.http_post`). Le champ photo reste hébergé sur Supabase Storage — envoyer seulement l'URL publique dans le webhook, ne pas tenter d'upload vers Google Drive.

**Binômage des étudiants** : ajouter un champ `binome_id` sur `profiles`, permettant de lier deux étudiants entre eux (attribution manuelle par le modérateur ou l'administrateur, cf. section 5).

---

## 3. PROFIL ÉTUDIANT

### 3.1 Paramètres du profil
Voir/modifier toutes les infos personnelles (les 29 champs), changer sa photo, voir sa classe actuelle et son binôme.

### 3.2 Académie (cœur de l'app)

- **Cours de la semaine**, organisés selon le vrai calendrier de la classe (cf. section 7 — dates réelles, pas juste "semaine N")
- Lecture vidéo en streaming (embed YouTube direct — pas de téléchargement) + lecture audio en streaming avec bouton téléchargement (fichiers migrés depuis Drive vers le bucket Supabase, cf. section 7)
- Zone de texte pour le résumé du cours
- Devoirs et exercices : liste + soumission (texte et/ou fichier)
- Note + feedback visible une fois corrigé par le modérateur
- **Mini-tâche pratique** après chaque cours (ex: "applique ce principe cette semaine et raconte comment ça s'est passé")
- **Barre de recherche** en haut de la page Académie : filtre par mot-clé (titre/description) et par semaine
- Tableau de bord : cours suivis, % présence, % résumés faits, notes devoirs/exercices, notes de méditation

### 3.3 Gamification (style Coursiv)
- **Streak visuel** : compteur de semaines consécutives, symbole propre au projet (pas d'emoji), message d'encouragement à 0 ("Ta première semaine commence maintenant" plutôt que "0 semaine")
- **Salle des badges** : écran listant TOUS les badges possibles — débloqués en couleur pleine avec date, non débloqués en grisé avec barre de progression claire (ex: "3/5 semaines de streak"), mise à jour en temps réel
- **Badge actif** choisi par l'étudiant, affiché en médaillon sur son avatar (cf. section 1)
- Animation de déblocage : halo doré qui pulse + léger scale (0.8→1, ~0.5s), pas de confettis
- **Certificat de cycle** en fin de classe (cf. section 9)
- Son léger optionnel togglable au déblocage d'un badge

### 3.4 Page "Revue" (nouvelle)
Page dédiée listant chronologiquement tous les cours suivis par l'étudiant, avec pour chacun :
- Son résumé écrit
- Sa note (une fois disponible)
- Accès rapide pour réécouter/revoir le cours
- **Message clé de clôture** : une fois la correction du modérateur reçue, l'étudiant est invité (notification in-app) à répondre à "Que retenez-vous de cette session qui s'achève ?" (champ texte court, non noté, réflexif) — cette réponse s'affiche comme clôture de l'entrée
- Filtre par statut (tout / en attente de correction / corrigé)
- Aperçu simple de la progression des notes dans le temps

### 3.5 Notes manuscrites (upload d'images)
L'étudiant peut importer une ou plusieurs **photos** (pas de vidéo) de ses notes manuscrites, avec un commentaire texte libre. Upload vers un bucket Supabase dédié `notes-manuscrites`. Apparaît dans l'espace de suivi du modérateur pour correction/notation/feedback (nouveau type de soumission, à distinguer des devoirs classiques).

### 3.6 Service
Groupe de service, jours de service, note de service, missions (issues du champ DÉPARTEMENT DE SERVICE de l'inscription). Le parcours pédagogique peut varier légèrement selon le focus de service.

---

## 4. PROFIL MODÉRATEUR — RÔLE RECENTRÉ SUR LE SUIVI D'ÂME

Le rôle du modérateur n'est **pas** qu'administratif — c'est un accompagnement pastoral individualisé structuré autour de 3 axes :

### 4.1 Fiche de suivi d'âme (privée — modérateur et admin UNIQUEMENT, jamais visible par l'étudiant)
Pour chaque étudiant de sa/ses classe(s), le modérateur tient une fiche avec :
- **Assiduité** : présence, régularité — le modérateur peut voir ET annoter le streak/présence de l'étudiant (pas juste consulter)
- **Contrôle de méditation** : suivi qualitatif de la vie spirituelle personnelle — espace d'observations libres, pas juste une note chiffrée
- **Situation sociale** : notes sur le contexte de vie de l'étudiant (famille, travail, difficultés) pour un suivi pastoral dans la durée
- **Historique de suivi** : journal chronologique horodaté des observations du modérateur, pas juste un instantané modifiable

Confidentialité stricte : RLS Supabase doit garantir que ces données ne sont accessibles qu'au modérateur assigné et aux administrateurs — jamais à l'étudiant concerné, jamais à un autre modérateur non assigné à cette classe.

### 4.2 Programme de modération
Planning des cours à modérer (dates réelles, cf. section 7), état de chaque cours (audio/vidéo présents ou non).

### 4.3 Gestion des cours
Upload audio/vidéo vers le bucket, édition métadonnées, écriture/upload du plan de modération.

### 4.4 Suivi académique
Liste des étudiants de sa/ses classe(s) (filtrée strictement, pas tous les étudiants), leurs soumissions (devoirs + notes manuscrites), notation (note + feedback), présence.

### 4.5 Rapport de modération
Rédaction de rapport + observations après chaque session, historique consultable.

### 4.6 Binômage et passage de classe
Attribution/modification des binômes d'étudiants de sa classe. Déclenchement du passage de classe en fin de période (manuel, volontaire).

---

## 5. PROFIL ADMINISTRATEUR

### 5.1 Accès total
Modification de tous les profils, révocation d'accès, création manuelle de comptes modérateur/admin.

### 5.2 Gestion des modérateurs (table de liaison many-to-many, PAS un simple class_id)
- Ajouter/retirer un modérateur (promotion depuis étudiant ou création directe)
- Attribuer une ou plusieurs classes à un modérateur, modifiable à tout moment
- Vue d'ensemble : quel modérateur gère quelle(s) classe(s)
- Définir/modifier le planning de modération (jours/créneaux) de chaque modérateur — visible par l'admin pour tous les modérateurs, et par chaque modérateur pour son propre planning

### 5.3 Tableaux de bord
- Général : total étudiants, présence moyenne, classes actives
- Par classe (Connaître & Servir Christ / Croître avec Jésus / Consécration)
- **Statistiques d'engagement** : ex. quel cours a le plus faible taux de résumé fait

### 5.4 Suivi et export
- Notes, présence, résumés, méditation par étudiant, cours après cours
- Export CSV (filtrable par classe) et bulletin PDF individuel

---

## 6. NAVIGATION ET UX

- Clic sur la photo de profil (header) → redirige vers Paramètres du profil
- Badge actif en médaillon sur l'avatar, cliquable → ouvre la Salle des badges (cf. 3.3)
- Barre de recherche fonctionnelle sur la page Académie (filtre temps réel)

---

## 7. PROGRAMMES DE COURS RÉELS (dates de la session Juillet-Novembre 2026)

Utilise ces données réelles pour peupler la table `courses` (titre, date, objectif) — structure commune aux 3 classes : Prise de contact (9 août, avec binômage) → 9-10 thèmes hebdomadaires → Rattrapage → Examen final → Clôture.

**Classe 1 — "Connaître & Servir Christ"** (clôture 8 nov., Agapè + remise des bulletins) :
9 août Prise de contact · 16 août La vision Vases d'Honneur · 23 août Servir Dieu · 30 août La méditation et Bible · 6 sept. Évangélisation · 13 sept. La croix 1&2 · 20 sept. La Nouvelle Création · 27 sept. Le salut · 4 oct. Le péché et ses conséquences · 11 oct. La vie de sanctification I · 18 oct. La Trinité et le Saint-Esprit · 25 oct. Rattrapage · 1 nov. Examen final + exposé · 8 nov. Agapè/clôture

**Classe 2 — "Croître avec Jésus"** (clôture 8 nov.) :
9 août Prise de contact · 16 août La vision Vases d'Honneur · 23 août La méditation et Bible · 30 août Servir Dieu · 6 sept. Évangélisation · 13 sept. Les fausses prophéties et fausses doctrines · 20 sept. La prière · 27 sept. L'amour · 4 oct. Les dîmes et offrandes · 11 oct. La loi de l'honneur · 18 oct. L'éternité · 25 oct. Rattrapage · 1 nov. Examen final + exposé · 8 nov. Agapè/clôture

**Classe 3 — "Consécration"** (se termine par une **Cérémonie de Graduation le 1er nov.** — événement physique à refléter dans l'app) :
9 août Prise de contact · 16 août La vision Vases d'Honneur · 23 août La méditation et Bible · 30 août Évangélisation · 6 sept. La sanctification niveau 2 · 13 sept. L'amour niveau 2 · 20 sept. La communion fraternelle · 27 sept. La Foi · 11 oct. Rattrapage · 25 oct. Examen final · 1 nov. Cérémonie de Graduation

**Médias des cours** : voir le fichier `media_cours_academie.json` fourni séparément — contient, pour chaque cours de chaque classe (+ tronc commun), les liens vidéo YouTube (utilisables directement en embed, zéro coût de stockage) et les liens audio Google Drive (à télécharger puis réuploader manuellement dans le bucket Supabase `cours` — ne jamais utiliser les liens Drive tels quels en production). Structure le champ `video_url` des cours pour accepter un ID YouTube embarquable directement.

---

## 8. VIE ET ANIMATIONS DE L'APPLICATION

Utilise des composants copier-coller depuis :
- Magic UI : https://magicui.design/docs/components (notamment "Marquee")
- react-bits : https://www.reactbits.dev/ (micro-animations)

1. Halo doré + scale au déblocage de badge
2. Remplissage animé du streak à la validation d'une semaine
3. Bandeau accent de couleur légèrement différent le dimanche (nuance or) vs le reste de la semaine
4. **Symboles christocentriques en filigrane** (opacité 3-5%, même style linéaire que la torche/logo existant), un par section :
   - Landing : croix simple
   - Académie : flamme/lampe
   - Devoirs / Revue : livre ouvert
   - Service : mains jointes
   - Certificat : couronne
5. Bandeau de photos de profil défilant (Marquee) sur la landing
6. Son léger optionnel togglable au déblocage de badge
7. Citation/verset du jour dans le header de chaque page (cf. section 1)

---

## 9. CERTIFICAT DE CYCLE

- Fond blanc/institutionnel (aligné à la nouvelle charte), bordure fine dans les couleurs du logo
- Logo officiel de l'Académie en en-tête
- Couronne stylisée (même famille graphique que le reste)
- Nom de l'étudiant en grand (Playfair Display)
- Texte de complétion adapté à la classe réellement terminée (ex: "pour avoir achevé avec persévérance le cycle Connaître & Servir Christ")
- Verset biblique différent selon la classe : cohérent avec le thème (1 Tim 6:12 envisageable pour le cycle complet, 2 Tim 2:20-21 comme verset fondateur de toute l'Académie — à utiliser en priorité sur le certificat de fin de Consécration/Classe 3, en écho à la Cérémonie de Graduation physique)
- Date d'émission + identifiant unique (format AVH-2026-C[X]-[numéro])
- Génération PDF (jspdf) + aperçu dans l'app

---

## 10. SÉCURITÉ

- RLS strict : étudiant ne voit que ses propres données ; modérateur limité à sa/ses classe(s) assignée(s) ; admin voit tout
- **Fiche de suivi d'âme strictement privée** (modérateur assigné + admin uniquement, jamais l'étudiant — cf. section 4.1)
- Toute policy UPDATE doit avoir une clause WITH CHECK empêchant l'auto-modification de `role`/`class_id` par un modérateur
- Rate limiting sur l'inscription
- Validation réelle du type de fichier (magic bytes, pas juste l'extension) sur tous les uploads (cours, devoirs, notes manuscrites, avatars)
- Aucune clé `service_role` côté frontend, uniquement la clé `anon`
- Redirect URLs Supabase limitées au(x) domaine(s) de production réel(s), pas de wildcard

---

## 11. POINTS TECHNIQUES TRANSVERSES

- Aucun écran placeholder ("à venir") — tout doit être fonctionnel
- Retour visuel clair sur chaque action (toast, état de chargement)
- Règles d'attribution streak/badges documentées clairement dans le code
- Relation modérateur ↔ classes en vraie table de liaison many-to-many
- Fichier `public/_redirects` pour le routage SPA en production (`/* /index.html 200`)
- Build vérifié (`tsc -b && vite build`) sans erreur avant toute livraison

---

Passe en revue ce document intégralement, exécute dans un ordre logique (identité visuelle → base de données → inscription → étudiant → modérateur → admin → animations → certificat → sécurité), et fais un rapport final point par point.

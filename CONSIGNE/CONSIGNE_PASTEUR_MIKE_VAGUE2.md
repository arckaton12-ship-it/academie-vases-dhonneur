# CONSIGNE — RETOURS PASTEUR MIKE (2e vague, détaillée)

## 1. CORRECTIONS DE TEXTE — LANDING ET FAQ

- Corrige "Forme-Toi" en **"Formes-Toi"** sur la page d'accueil.
- FAQ "L'académie est-elle vraiment gratuite ?" → remplace la réponse actuelle par exactement :
> "Presque gratuit, une contribution de 10000 F seulement est demandée pour son Kit (T-Shirt de l'Académie, Cahier de Méditation, Agapé) entièrement. Aucun frais d'inscription. L'Académie est une école de formation des disciples de l'église Vases d'Honneur, implémentée par l'Assemblée Eaux Paisibles de Yaoundé."
- FAQ "Je peux rejoindre à tout moment ?" → remplace la réponse actuelle par exactement :
> "Les inscriptions sont ouvertes 3 fois dans l'année. Renseigne-toi pour la prochaine session, et tu commences au niveau 1 et tu progresses selon ton rythme et les recommandations de l'administration de l'École."

## 2. LISTES DÉROULANTES — CORRECTION OFFICIELLE (remplace toute liste précédente)

**TRIBU** (liste corrigée, remplace la précédente) :
Ruben, Siméon, Lévi, Juda, Zabulon, Issacar, Dan, Gad, Aser, Nephtali, Joseph, Benjamin, Aucune

**DÉPARTEMENT** (liste corrigée et étendue, remplace la précédente) :
ACCUEIL, ADMINISTRATION, ADN, ACADÉMIE D'HONNEUR, BAPTÊME, BLOOM, CHANTRES, COMMUNICATION, COMPTABILITÉ, DÉCORATION, DIGITAL, ENFANT D'HONNEUR, ELEEO, GDC, INTERCESSION, LOGE PASTORALE, LEAMANS, MÉDECINE D'HONNEUR, MOYENS GÉNÉRAUX, MRES, PLUME D'HONNEUR, PROTOCOLE, COEUR D'HONNEUR, SAINTE CÈNE, EVANGÉLISATION, AUCUN

Applique ces deux listes corrigées partout où Tribu/Département apparaissent : formulaire d'inscription, modification de profil étudiant.

**CLASSE (formulaire d'inscription uniquement)** : le sélecteur de classe à l'inscription doit afficher "Classe 1", "Classe 2", "Classe 3" (labels simples), même si le nom thématique complet (ex: "Connaître & Servir Christ") reste affiché ailleurs dans l'app (dashboard, certificat).

**MODE DE PAIEMENT** : remplace les options actuelles par exactement 3 choix : Espèces, Mobile Money, Carte Visa.

## 3. PROFIL ÉTUDIANT — ÉDITION

- Confirme (ou corrige si nécessaire) que les champs Tribu et Département dans l'écran de modification du profil étudiant sont bien des listes déroulantes utilisant les nouvelles listes de la section 2.
- Après validation d'une modification de profil, les champs du formulaire doivent redevenir vides (réinitialisés), pas rester pré-remplis avec les anciennes valeurs.
- **Bulletin de notes** : un modèle/template précis existe, à fournir séparément (fichier à venir dans un prochain message) — ne pas commencer le travail de mise en forme du bulletin avant réception de ce modèle, mais prépare la structure de données nécessaire (notes, présence, méditation, service) pour qu'elle soit prête à être branchée dessus.

## 4. DASHBOARD ÉTUDIANT — BUG D'OUVERTURE SUR LA MAUVAISE SEMAINE

Bug confirmé : le dashboard s'ouvre actuellement sur la semaine 15 par défaut. Corrige pour qu'il s'ouvre :
- Sur la semaine 2 par défaut pour un étudiant classique, OU
- Sur la semaine actuellement en cours (calculée depuis la vraie date du jour comparée au calendrier réel des cours) pour un étudiant qui s'inscrit tardivement, en retard sur le programme

Implémente le calcul par date réelle plutôt qu'un numéro fixe — la logique doit déterminer dynamiquement quelle semaine est "actuelle" selon la date du jour et le calendrier de la classe de l'étudiant.

## 5. RENOMMAGE ET RÉORGANISATION — ONGLET ACADÉMIE

- **Semaine 1** : remplace le titre actuel "La Vision..." par exactement : **"Rentrée Solennelle de l'Académie — Prise de Contact"**
- **"Verset du Jour"** → renomme en **"Méditation Biblique du Jour — Verset(s) à Méditer"** (garde la possibilité d'afficher plusieurs versets, pas juste un seul, si la structure de données le permet déjà via la table meditation_verses)
- **Réorganisation de l'ordre des sections** dans l'onglet Académie : AVANT la barre de recherche de cours, ajoute une rubrique **"Cours de la Semaine"** regroupant : le cours en vidéo et en audio, et les options "Regarder le cours", "Ton résumé du cours", "Ta présence", "Mise en pratique" — toutes réunies dans cette rubrique unique en haut, la recherche vient après.

## 6. MISE EN PRATIQUE — GESTION ADMIN

Actuellement la mini-tâche pratique par cours est probablement générique ou fixe. Crée une interface admin permettant de définir/modifier le texte précis de "mise en pratique" pour CHAQUE cours individuellement (pas un texte générique automatique) — l'administration doit pouvoir écrire une action concrète adaptée à chaque thème de cours.

## 7. RECHERCHE DE COURS — RESTRICTION PAR CLASSE

- Étudiants de **Classe 1 et Classe 2** : la recherche de cours ne doit retourner que les cours du parcours de LEUR PROPRE classe.
- Étudiants de **Classe 3** : la recherche doit leur donner accès aux cours de TOUTES les classes (1, 2 et 3).

Ajuste la logique de recherche (et les policies RLS associées si nécessaire) en conséquence.

## 8. SERVICE — GROUPES ET MESSAGERIE DE GROUPE

- Chaque étudiant doit voir clairement son **groupe de service** (déjà collecté à l'inscription via DÉPARTEMENT) et la **liste des membres** de ce groupe, filtrée par classe (les groupes de service sont organisés par classe).
- Dans la messagerie, ajoute deux options explicites au démarrage d'une conversation : **"Parler à une personne"** (existant) et **"Parler à mon Groupe de Service"** (nouveau — crée un salon de discussion de groupe partagé par tous les membres du même groupe de service au sein d'une même classe).

## 9. BUG MESSAGERIE — CHARGEMENT DES CONTACTS

Bug confirmé et à corriger en priorité : le chargement de la liste de contacts pour démarrer une nouvelle conversation ne fonctionne pas actuellement. Diagnostique et corrige.

## 10. NOUVELLE RUBRIQUE — "MON BILAN DE LA SEMAINE"

Ajoute cette rubrique sur le profil/suivi de l'étudiant (position à ton jugement — en haut ou en bas de l'onglet Académie ou du tableau de bord), avec ces 3 sous-parties, chacune avec un choix à sélectionner par l'étudiant chaque semaine :

- **Résumé** : "J'ai fait mon résumé" / "Je n'ai pas fait mon résumé"
- **Méditation de la Bible** : "J'ai médité tous les jours" / "J'ai médité seulement [nombre de jours à préciser]" / "Je n'ai pas médité"
- **Évangélisation** : "J'ai gagné une âme par l'évangélisation" (avec champs Nom et Numéro de téléphone de la personne gagnée) / "J'ai évangélisé, sans gagner une âme" / "Je n'ai pas évangélisé"

Ces données doivent être visibles côté modérateur (fiche de suivi d'âme) et côté administrateur (suivi académique), pas seulement stockées côté étudiant.

## 11. SECTION ADMINISTRATION — ANNONCES

- Ajoute la possibilité de **modifier/corriger une annonce déjà publiée** (actuellement probablement impossible une fois publiée).
- Les annonces envoyées doivent arriver **personnalisées avec le nom de chaque étudiant** (ex: "Bonjour [Prénom], ...") plutôt qu'un texte générique identique pour tous.
- Crée un système d'**annonces automatisées de rappel** (cf. section 12 pour les textes exacts et le timing).
- Ajoute la possibilité de **modifier manuellement le parcours de cours** déjà en place (dates, titres) — la programmation actuelle doit pouvoir évoluer sans tout recréer depuis la base.
- **Bug à corriger** : le tableau de bord par classe ne s'affiche pas pour la Classe 1 dès le chargement initial — diagnostique et corrige.

## 12. ANNONCES AUTOMATISÉES DE RAPPEL — TEXTES EXACTS ET TIMING

Implémente deux rappels automatiques hebdomadaires (via cron / tâche planifiée, envoyés comme annonces personnalisées + notification) :

**Rappel du samedi matin — résumé** (envoyé chaque samedi matin) :
> "Chers étudiants…. nous te rappelons que ton résumé du cours de la semaine est attendu aujourd'hui au trop tard à 22H59 à envoyer à l'adresse E-mail suivante : vhassembleeeauxpaisibles@gmail.com - Et ainsi que dans l'application.
> L'administration."

**Rappel du samedi matin — cours du dimanche** (envoyé chaque samedi matin) :
> "Chers étudiants…. ton prochain cours de l'académie c'est demain à 11h en présentiel à l'église.
> Bien vouloir te munir de :
> • Ton cahier de méditation
> • Ton résumé imprimé
> à remettre aux admins de vos classe avant le début du cours.
> L'administration"

Personnalise avec le nom de l'étudiant si possible sans casser le ton du message.

## 13. MÉDITATION DE LA BIBLE — PROGRAMMATION ADMIN

- Confirme/renforce la possibilité de programmer les versets à méditer, jour par jour, pour toutes les classes OU pour une classe en particulier (vérifie si la table `meditation_verses` existante permet déjà cette granularité par jour, pas juste par classe globalement).
- Dans le dashboard général admin, le dashboard par classe, ET la fiche individuelle de chaque étudiant : remplace le terme **"Série"** par **"Méditation"**, et affiche le statut réel de méditation de la période (pas juste un streak générique).

## 14. NOUVELLE CLASSE — "GRADUATION"

Crée une 4e entrée dans la table `classes` nommée **"Graduation"**, destinée à recevoir les étudiants de Classe 3 (Consécration) qui sont promus/admis à la graduation. Ajoute la possibilité pour l'admin de transférer un étudiant de Classe 3 vers Graduation (action de promotion finale, distincte du passage de classe normal).

## 15. NOUVEAU RÔLE — "ADMINISTRATEUR DE CLASSE"

**Important, nouveau rôle à créer**, distinct de MODERATEUR (suivi d'âme uniquement) et ADMINISTRATEUR (accès total) :

- Rôle `ADMIN_CLASSE`, assigné à un administrateur pour UNE classe spécifique (1, 2, ou 3) — relation similaire à `moderator_classes` mais pour ce nouveau rôle.
- Accès : liste complète des étudiants de SA classe uniquement, avec toutes leurs informations.
- Responsabilités : reporter la présence de chaque étudiant, la note de chaque devoir, la note de méditation de chaque semaine, la note de service de chaque étudiant — de sa classe uniquement.
- Peut envoyer des messages aux étudiants de sa classe, individuellement ou en groupe (annonce ciblée à sa classe).
- RLS strict : un Administrateur de Classe ne voit et ne modifie que les données des étudiants de sa classe assignée, jamais les autres classes, jamais les fiches de suivi d'âme (qui restent réservées à MODERATEUR + ADMINISTRATEUR).

Crée l'interface de création de ce type de compte côté admin (même flow que pour les modérateurs : mot de passe temporaire + changement obligatoire à la première connexion).

## 16. CONNEXION — AFFICHAGE DU MOT DE PASSE

Ajoute une icône "œil" (afficher/masquer) sur le champ mot de passe des formulaires de connexion, pour permettre à l'utilisateur de vérifier ce qu'il a tapé avant de valider.

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

1. Section 9 (bug messagerie contacts) et section 4 (bug semaine 15) — bugs bloquants en priorité
2. Section 11 point "Classe 1 dashboard" — bug également prioritaire
3. Section 2 (listes déroulantes officielles) — impacte l'inscription en cours
4. Section 1 (textes landing/FAQ) et section 16 (afficher mot de passe) — rapides
5. Section 5 (réorganisation Académie) et section 6 (mise en pratique admin)
6. Section 7 (restriction recherche par classe)
7. Section 10 (Bilan de la semaine)
8. Section 8 (groupes de service + messagerie de groupe)
9. Section 13 (méditation admin) et section 3 (profil étudiant, sauf bulletin — en attente du modèle)
10. Section 12 (annonces automatisées) et section 11 (reste)
11. Section 14 (classe Graduation) et section 15 (nouveau rôle Administrateur de Classe) — plus structurants, en dernier

Rapporte chaque section confirmée par un test réel. Le bulletin (section 3) reste en attente du fichier modèle à fournir séparément.

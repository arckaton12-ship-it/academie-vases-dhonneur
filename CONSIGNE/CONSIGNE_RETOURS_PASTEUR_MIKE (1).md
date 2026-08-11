# CONSIGNE — RETOURS PASTEUR MIKE

## 1. LISTES DÉROULANTES TRIBU ET DÉPARTEMENT (inscription)

Sur le formulaire d'inscription étape 2, les champs TRIBU et DÉPARTEMENT DE SERVICE doivent être des menus déroulants (select) avec choix strictement limité à la liste existante — pas de champ texte libre. Ceci pour fiabiliser les inscriptions et réduire les erreurs de saisie qui ont fait planter/buguer les inscriptions ce matin (cf. point 5).

Listes exactes à utiliser :
- **TRIBU** : Lévi / Juda / Siméon / Ruben / Zabulon / Issacar / Dan / Nephtali / Gad / Aser / Manassé / Éphraïm / Benjamin / Aucune
- **DÉPARTEMENT DE SERVICE** : Intercession / Chantre / Communication / Accueil / Gestion des Cultes / Médecine d'Honneur / Portier / Évangélisation / Amis des Nouveaux (ADN) / Social / Aucun

Vérifie qu'il n'existe pas déjà un champ texte libre pour ces deux champs, et convertis-le en select si c'est le cas.

## 2. TEXTE DE LA PAGE D'ACCUEIL — REMPLACEMENT EXACT

Remplace le texte actuel :
> "L'académie biblique en ligne de l'Assemblée Eaux Paisibles de Yaoundé. Un parcours structuré pour devenir un disciple solide."

Par exactement :
> "L'académie biblique en ligne de l'Église Vases d'Honneur Assemblée Eaux Paisibles de Yaoundé. Un parcours structuré pour acquérir de solide fondements en Christ et devenir un disciple authentique de Jésus."

Vérifie l'exactitude au caractère près avant de considérer que c'est fait — le commanditaire est précis sur ce texte.

## 3. FIABILITÉ DE L'INSCRIPTION — BUG CE MATIN (priorité haute)

Plusieurs étudiants n'ont pas réussi à s'inscrire ce matin, l'app buggait. Investigue et corrige :
- Vérifie les logs Supabase (erreurs API, rate limiting déclenché, timeout) sur la période concernée
- Vérifie si le rate limiting client (cooldown 30s) mis en place précédemment est trop agressif pour un usage réel en pic de charge (beaucoup d'étudiants qui s'inscrivent en même temps un dimanche) — envisage de l'assouplir ou de le remplacer par une vraie protection serveur si c'est la cause
- Vérifie si la table `webhook_logs` (créée précédemment) contient des erreurs à ces horaires, qui pourraient indiquer un blocage en cascade
- Vérifie la capacité de connexions concurrentes Supabase (plan actuel) face à un pic d'inscriptions simultanées
- Rapporte la cause identifiée et la correction appliquée, avec un test de charge simple si possible (plusieurs inscriptions simulées en parallèle)

## 4. RESPONSIVE TOTAL — TOUS TYPES D'ÉCRANS (desktop, tablette, téléphone)

Exigence complète, pas seulement le bug PWA rapporté : l'application doit s'adapter parfaitement à TOUS les formats d'écran, dans les deux orientations où c'est pertinent.

- **Desktop** (≥1280px) : mise en page qui exploite l'espace disponible (pas juste une version mobile étirée avec des vides), navigation adaptée au clavier/souris
- **Tablette** (768px-1024px), portrait ET paysage : layout intermédiaire cohérent, pas un simple redimensionnement du mobile
- **Téléphone** (< 768px), portrait ET paysage : déjà largement fait, à revalider
- **Bug PWA spécifique** : quand l'app est installée via le raccourci sur l'appareil, elle reste bloquée en mode portrait et ne bascule pas en paysage/tablette. Corrige le fichier `manifest.json`/`manifest.webmanifest` — le champ `"orientation"` est probablement fixé à `"portrait"` alors qu'il devrait être `"any"` pour laisser l'appareil gérer nativement la rotation.
- Teste chaque écran clé de l'app (landing, auth, dashboards étudiant/modérateur/admin, messagerie, salle des badges, certificat) à ces différentes largeurs et confirme visuellement qu'il n'y a ni débordement, ni élément coupé, ni texte illisible.

## 5. AMÉLIORATION DE LA PRÉSENTATION DU LOGO

Le logo est jugé trop petit/peu mis en valeur sur la landing et/ou dans les headers. Augmente sa taille d'affichage de manière cohérente (sans casser la mise en page), et vérifie qu'il est net (pas pixelisé) à cette taille plus grande.

Un nouveau fichier logo en meilleure qualité est ajouté au dossier du projet sous le nom **"NEW BRAND LOGO"** (à localiser par ce nom, extension à vérifier — probablement .png ou .jpg). Utilise ce fichier pour remplacer l'ancien logo partout où il apparaît (landing, headers de dashboards, splash screen, certificat, favicon).

## 6. MISE À JOUR DU PLANNING RÉEL DES COURS (changement de programme)

Le planning a changé — remplace les données actuelles de la table `courses` par ces informations à jour, classe par classe. Structure commune : Prise de contact (9 août) → thèmes hebdomadaires avec modérateur assigné → Rattrapage → Veillée finale/Examen → Clôture.

### CLASSE 1 — dates, thèmes, modérateurs assignés
| Date | Thème | Modérateur assigné |
|---|---|---|
| 9 août | Prise de contact, La vision Vases d'Honneur | ÉQUIPE ADMINISTRATION |
| 16 août | La Vision de Vases d'Honneur | Pasteur Mike |
| 23 août | La méditation et Bible | AP Alvine |
| 30 août | Servir Dieu | AP Joël |
| 6 sept. | Évangélisation | AP Arnauld |
| 13 sept. | La croix 1 & 2 | AP Joël |
| 20 sept. | La Nouvelle Création | AP Arnauld |
| 27 sept. | Le salut | Pasteur Mike |
| 4 oct. | Le péché et ses conséquences | AP Alvine |
| 11 oct. | La vie de sanctification (partie I) | AP Rebecca |
| 18 oct. | La Trinité et le Saint-Esprit | AM Suzy |
| 25 oct. | Rattrapage des devoirs hebdomadaires | ÉQUIPE ADMINISTRATION |
| 1 nov. | Veillée finale & Exposés | ÉQUIPE ADMINISTRATION |
| 6 nov. | Examen Final | ÉQUIPE ADMINISTRATION |
| 8 nov. | Agapè, remise des bulletins, fin de session | ÉQUIPE ADMINISTRATION |

Objectifs pédagogiques par thème (à associer à chaque cours) :
- La méditation et Bible : "Apprendre à méditer et acquérir une vie de méditation" — sous-points : qu'est-ce que la méditation, les avantages de la méditation dans la vie d'un chrétien, comment méditer, quels sont les outils de la méditation ; présenter la Bible, la découvrir et l'utiliser efficacement
- Servir Dieu : "Travailler pour Dieu, pour les intérêts de Dieu, l'honneur de servir Dieu" — sous-points : définition, quel est le but de la création, les séductions liées au service de Dieu, les avantages de servir Dieu, qu'est-ce que le service de Dieu
- Évangélisation : "Gagner des âmes"
- La croix 1&2 : "Comprendre l'œuvre de la croix" — sous-points : les aspects de la croix, les avantages de la croix
- La Nouvelle Création : "Découvrir et marcher selon notre identité en Christ" — sous-points : que suis-je devenu en Christ, définition de la nouvelle création, quels sont les avantages de la nouvelle création
- Le salut : "Comprendre la mission de Jésus : le salut" — sous-points : mission de Jésus, quel lien existe-t-il entre le péché et la mort, que procure le salut, comment obtient-on le salut, peut-on perdre le salut
- Le péché et ses conséquences : "Identifier le péché et ses conséquences" — sous-points : définition, comment le péché agit-il en l'homme, les conséquences du péché
- La vie de sanctification (I) : "Connaitre la sanctification et mener une vie de sanctification" — sous-points : définition, pourquoi vivre la sanctification
- La Trinité et le Saint-Esprit : "Comprendre la trinité" — sous-points : Père est Dieu, Jésus est Dieu, Saint-Esprit est Dieu, que signifie faire les choses "au nom de" ; connaître le Saint-Esprit et savoir ce qu'il apporte à un enfant de Dieu — qui est le Saint-Esprit et les preuves qu'il est Dieu, quelles sont les représentations du Saint-Esprit, les péchés contre le Saint-Esprit

### CLASSE 2 — dates, thèmes, modérateurs assignés
| Date | Thème | Modérateur assigné |
|---|---|---|
| 9 août | Prise de contact | ÉQUIPE ADMINISTRATION |
| 16 août | La vision Vases d'Honneur | Pasteur Mike |
| 16 août | La méditation et Bible | AP Alvine |
| 23 août | Servir Dieu | AP Joël |
| 13 sept. | Évangélisation | AP Arnauld |
| 20 sept. | Les fausses prophéties et les fausses doctrines | AP Rebecca |
| 27 sept. | La prière | AM Suzy |
| 4 oct. | L'amour | AP Joël |
| 11 oct. | Les dîmes et offrandes | AM Suzy |
| 18 oct. | La loi de l'honneur | Pasteur Mike |
| 25 oct. | L'éternité | AP Arnauld |
| 1 nov. | Rattrapage des devoirs hebdomadaires | ÉQUIPE ADMINISTRATION |
| 8 nov. | Examen Final et Exposé sur un fait de société | ÉQUIPE ADMINISTRATION |
| 15 nov. | Agapè, remise des bulletins, fin de session | ÉQUIPE ADMINISTRATION |

Objectifs pédagogiques : "Discerner les faux prophètes et docteurs, discerner les fausses prophéties et les fausses doctrines" (fausses prophéties) ; "Savoir prier et rendre la prière efficace" (la prière) ; "Manifester l'amour" (l'amour) ; "Distinguer les dîmes des offrandes, savoir qu'est-ce qu'on doit offrir au Seigneur" (dîmes/offrandes) ; "Honorer les autorités et les personnes établies sur nous" (loi de l'honneur) ; "Comprendre l'éternité" (éternité).

### CLASSE 3 — dates, thèmes, modérateurs assignés
| Date | Thème | Modérateur assigné |
|---|---|---|
| 9 août | Prise de contact | ÉQUIPE ADMINISTRATION |
| 16 août | La vision Vases d'Honneur | Pasteur Mike |
| 16 août | La méditation et Bible | AP Alvine |
| 30 août | Servir Dieu | AP Joël |
| 6 sept. | La sanctification Niveau 2 et Préparation Graduation Décembre 2026 | Pasteur Mike |
| 13 sept. | L'amour niveau 2 (partie I et II) | AP Joël |
| 20 sept. | La Communion fraternelle | AP Rebecca |
| 27 sept. | La Foi - Partie 1 | AP Arnauld |
| 4 oct. | La Foi - Partie 2 | AP Arnauld |
| 11 oct. | Préparation Graduation Décembre 2026 | ÉQUIPE ADMINISTRATION |
| 18 oct. | Préparation Graduation Décembre 2026 | ÉQUIPE ADMINISTRATION |
| 25 oct. | Examen Final | ÉQUIPE ADMINISTRATION |
| 8 nov. | Cérémonie de Graduation | ÉQUIPE ADMINISTRATION |

Objectif Sanctification Niveau 2 : "Comprendre pourquoi le Seigneur Jésus a lavé les pieds de ses disciples" — sous-points : comment est-ce qu'on se lave les pieds, que représentent les pieds spirituels, qu'est-ce qui souille les pieds, comment conserver les pieds lavés.
Objectif Amour niveau 2 : "Comment véritablement aimer Dieu et les hommes" — sous-point : connaître l'amour.
Objectif Communion fraternelle : "La communion, force vitale de l'église" — sous-points : définition, conditions de base, bénéfices, obstacles.
Objectif La Foi : "Comment avoir une foi qui déplace les montagnes ?" — sous-points : apprendre à manifester la foi, 5 étapes pour manifester la foi, l'importance de la foi, comment marcher avec la foi.

**Important** : ajoute un champ `moderator_assigned` (texte simple, nom du modérateur) sur chaque entrée de cours pour refléter qui module chaque session — utile pour l'affichage du programme de modération. Remplace toute donnée de calendrier précédente par celle-ci (le programme a changé depuis la dernière version).

## 7. À FOURNIR SÉPARÉMENT (pas dans cette consigne)
- (déjà fourni) Nouveau logo — voir section 5, fichier "NEW BRAND LOGO" dans le dossier du projet

## 8. POPUP OBLIGATOIRE — ÉTUDIANTS SANS CLASSE ASSIGNÉE (priorité haute)

Certains étudiants déjà inscrits n'ont pas de classe assignée et n'ont donc accès à aucun cours actuellement, sans le savoir clairement. Corrige :

- À la connexion d'un étudiant dont `class_id` est NULL, affiche un **popup modal bloquant** (pas juste un bandeau discret) l'empêchant d'accéder au reste de l'app tant qu'il n'a pas agi. Le popup doit :
  - Expliquer clairement en une phrase visible que son compte n'est rattaché à aucune classe et qu'il ne peut donc pas encore accéder aux cours
  - Proposer un bouton clair "Demander l'accès à une classe" 
  - Ce bouton déclenche une demande visible côté administrateur (nouvelle entrée dans une liste "Demandes d'attribution de classe en attente", ou équivalent) — PAS une auto-attribution, l'admin doit valider/choisir la classe
  - Tant que la demande n'est pas traitée, le popup doit indiquer un état "Demande envoyée, en attente de validation" au lieu de proposer de redemander en boucle
- Design cohérent avec la charte (teal/or/rouge sur fond blanc), message ferme mais dans un ton chaleureux, pas alarmant/agressif
- Côté admin : ajoute un onglet ou une section "Demandes de classe en attente" listant ces étudiants, avec un sélecteur pour leur attribuer directement une classe (réutilise le composant déjà existant d'attribution de classe côté admin)

## 9. VÉRIFICATION D'INTÉGRITÉ — LES 29 CHAMPS D'INSCRIPTION DOIVENT TOUS ÊTRE PRÉSENTS

Avant tout autre changement, confirme que le formulaire d'inscription étape 2 collecte bien la totalité des 29 champs suivants, sans qu'aucun n'ait été perdu ou oublié au fil des modifications successives :

```
1. Horodateur (généré automatiquement)
2. Adresse E-mail
3. NOMS
4. PRÉNOMS
5. PHOTO PORTRAIT EN COULEUR
6. CONTACT TÉLÉPHONIQUE 1 (WhatsApp)
7. CONTACT TÉLÉPHONIQUE 2 (Telegram)
8. CONTACTS TÉLÉPHONIQUES D'URGENCE (Ami/Parent)
9. SEXE
10. CLASSES
11. TAILLE DE T-SHIRT
12. Date d'Inscription
13. CANAL DE FORMATION
14. MODE DE PAIEMENT DE L'INSCRIPTION
15. PROFESSION
16. QUARTIER DE RÉSIDENCE
17. DATE DE NAISSANCE
18. SITUATION MATRIMONIALE
19. NOMBRE D'ENFANTS
20. ÊTES-VOUS BAPTISÉ PAR IMMERSION ?
21. DATE DE BAPTÊME
22. DATE DE CONVERSION
23. DÉPARTEMENT DE SERVICE
24. TRIBU
25. TYPE D'ETUDIANT
26. Capacité de lire le français
27. Capacité d'écoute du français
28. Capacité d'écrire le français
29. ENGAGEMENT
```

Fais une vérification champ par champ dans le composant `RegistrationStep2.tsx` (ou équivalent actuel) et dans la table `academy_registrations`, et signale explicitement si un champ manque ou a été supprimé par erreur — ne te contente pas de dire "c'est bon", liste les 29 champs avec leur statut présent/absent.

**Décision confirmée : pas de vérification d'email.** L'inscription reste instantanée (email/téléphone + mot de passe suffit), ne pas ajouter d'étape de confirmation par lien email.

## 10. COMPTES MODÉRATEURS — CRÉATION AVEC IDENTIFIANTS GÉNÉRÉS + PERSONNALISATION OBLIGATOIRE

Les modérateurs du planning réel (section 6) doivent avoir un compte dans l'app : Pasteur Mike, AP Alvine, AP Joël, AP Arnauld, AP Rebecca, AM Suzy, et l'ÉQUIPE ADMINISTRATION si besoin d'un compte partagé.

- Depuis l'interface admin existante de création de compte modérateur, ajoute la génération automatique d'un **mot de passe temporaire aléatoire sécurisé** (12+ caractères, majuscules/minuscules/chiffres) affiché une seule fois à l'admin au moment de la création, pour qu'il puisse le transmettre manuellement (hors app — SMS/WhatsApp) au modérateur concerné.
- **Changement de mot de passe obligatoire à la première connexion** : si un modérateur se connecte avec un mot de passe marqué comme temporaire (champ `must_change_password` sur profiles), le rediriger immédiatement vers un écran de changement de mot de passe avant tout accès au reste de l'app — pas de bouton "plus tard".
- Une fois le mot de passe personnalisé, le modérateur doit aussi pouvoir modifier son email de contact et sa photo de profil depuis ses paramètres (déjà existant normalement, à vérifier).

## 11. RENFORCEMENT DE LA SÉCURITÉ (au-delà de ce qui est déjà en place)

Objectif : durcissement sérieux et complet, pas une promesse de "zéro risque" (aucun système n'est garanti inhackable à 100%, mais on réduit la surface d'attaque au maximum raisonnable).

- **Sauvegarde automatique périodique de la base de données** : configure une sauvegarde régulière (quotidienne si possible via les outils Supabase, ou un export automatisé programmé) — avec de vraies données d'étudiants en jeu maintenant, une perte de données serait critique, pas juste gênante.
- **Masquage des données sensibles dans les logs** : vérifie que la table `webhook_logs` et tout autre système de logs/debug ne stocke jamais de mot de passe en clair, de token d'authentification, ou de donnée personnelle sensible non nécessaire au diagnostic — si c'est le cas, corrige immédiatement et purge les logs existants concernés.
- Confirme une nouvelle fois (vu tous les changements récents) : aucune clé `service_role` côté frontend, `.env` toujours absent de l'historique git, Redirect URLs Supabase limitées aux domaines de production réels.

## 12. AMÉLIORATIONS D'INTERFACE VALIDÉES

Le mode sombre existe déjà, ne pas le retoucher sauf bug constaté. Implémente les points suivants :

- **Skeleton loaders systématiques** : vérifie que CHAQUE écran chargeant des données (dashboards, messagerie, salle des badges, page Revue, liste des cours) affiche un état de chargement squelette cohérent avec la charte, plutôt qu'un flash de contenu vide ou un spinner générique — important pour une impression de fluidité même sur connexion lente.
- **Gestes tactiles mobiles (swipe)** : permettre de naviguer entre les onglets du dashboard étudiant (Académie/Devoirs/Revue/Service/Profil) par un geste de balayage horizontal, en plus des icônes de navigation existantes.
- **Indicateur de connexion réseau** : bandeau discret si la connexion est faible ou coupée ("Mode hors-ligne — tes réponses seront synchronisées au retour du réseau"), cohérent avec le mode hors-ligne partiel déjà prévu pour les résumés/réponses aux exercices.
- **Micro-feedback haptique** (vibration légère via l'API Vibration du navigateur) sur mobile, déclenché au déblocage d'un badge et à l'envoi d'un message — disponible nativement en PWA sur la plupart des téléphones Android.
- **Transitions de page** : ajoute un effet de fondu/glissement léger entre les changements de page/écran plutôt qu'un changement brutal, cohérent avec les animations déjà en place.

La barre de progression horizontale déjà existante n'a pas besoin de modification.

## 13. ANIMATIONS INTERACTIVES SUPPLÉMENTAIRES

En plus des animations déjà en place (halo badge, remplissage streak, filigranes, splash screen, bienvenue), ajoute :

- **Retour tactile sur les boutons** : léger effet d'enfoncement (scale 0.97 au clic/tap) sur tous les boutons primaires de l'app, pas juste un changement de couleur au survol.
- **Micro-célébration à la soumission d'un devoir** : petite animation de confirmation (icône qui s'envole légèrement, ou coche qui se dessine en fondu) à chaque soumission de devoir/exercice/résumé, pour donner un sentiment d'accomplissement même sur les actions courantes, pas seulement les gros jalons.
- **Compteurs animés (count-up)** : les chiffres du tableau de bord étudiant (% présence, % résumés, notes) doivent s'animer en comptant progressivement de 0 jusqu'à la valeur réelle au chargement de la page, plutôt que d'afficher le chiffre statique instantanément.
- **Messagerie vivante** :
  - Les nouveaux messages glissent délicatement depuis le bas à leur arrivée (léger effet de rebond), plutôt que d'apparaître brutalement
  - Ajoute un indicateur "en train d'écrire" (trois points qui pulsent) visible par le destinataire quand l'autre personne tape un message, via Supabase Realtime (canal de présence, en plus du canal de messages déjà en place)

Toutes ces animations doivent rester discrètes et cohérentes avec la sobriété de la charte (teal/or/rouge sur fond blanc) — elles renforcent l'expérience sans devenir distrayantes ou ralentir l'app.

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

1. Section 9 (vérification des 29 champs) — audit rapide avant tout le reste
2. Section 3 (bug d'inscription de ce matin) — priorité absolue, diagnostic réel
3. Section 1 (listes déroulantes tribu/département) — lié au point précédent
4. Section 8 (popup étudiants sans classe) — impact direct sur des utilisateurs déjà bloqués
5. Section 2 (texte landing) et section 5 (logo) — rapides
6. Section 6 (planning réel mis à jour) — remplacement des données
7. Section 10 (comptes modérateurs)
8. Section 4 (responsive total)
9. Section 11 (sécurité renforcée)
10. Sections 12 et 13 (interface et animations) — en dernier, une fois le fonctionnel solide

Rapporte chaque section confirmée par un test réel, pas juste "c'est fait" — liste explicitement ce qui a été vérifié et comment.

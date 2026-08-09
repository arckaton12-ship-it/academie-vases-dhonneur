# CONSIGNE — SPLASH SCREEN, BIENVENUE, ET AUDIT FONCTIONNEL COMPLET

## 0. TEXTE D'EN-TÊTE — CORRECTION IMPORTANTE (priorité, à faire en premier)

Sur la landing page (et partout où ce texte apparaît actuellement), remplace exactement comme suit :

- **Nom de l'Académie** : remplace tout titre actuel par exactement : **"Académie Vases d'Honneur — Assemblée Eaux Paisibles de Yaoundé"**
- **Sous-titre** : remplace "Formation biblique & discipulat — Yaoundé" par exactement : **"École de disciples"**
- **Phrase d'accroche** (nouvel élément, à ajouter sous le sous-titre, en italique ou style citation, cohérent avec la charte) : **"La Création attend avec un ardent désir la Révélation des Fils de Dieu" — Romains 8:19**

Vérifie qu'aucune autre occurrence de l'ancien texte ("Formation biblique & discipulat") ne subsiste ailleurs dans l'app (headers de dashboard, méta-description, titre de la page HTML, etc.) et remplace-la partout par la nouvelle formulation. C'est une précision à laquelle le commanditaire tient beaucoup — vérifie l'exactitude au caractère près (accents, tirets, majuscules) avant de considérer que c'est fait.

## 1. SPLASH SCREEN À L'OUVERTURE

Au premier chargement de l'app (une seule fois par session, pas à chaque navigation interne) : affiche le logo officiel en fondu + léger scale, pendant 1,5-2 secondes, avec un son court et discret (carillon doux, pas une fanfare) togglable dans les paramètres — même toggle que pour le son des badges. Transition fluide ensuite vers la landing ou le dashboard selon l'état de connexion.

## 2. ANIMATION DE BIENVENUE À L'INSCRIPTION

Une fois le compte créé, avant d'arriver sur le dashboard : écran de célébration court avec le logo qui pulse doucement, message personnalisé "Bienvenue dans la famille, [Prénom] !", léger effet de particules dorées discrètes (pas des confettis criards). Attribue automatiquement un badge "Nouveau membre" à ce moment, avec l'animation de halo doré déjà prévue pour le déblocage de badge.

Respecte la sobriété de la charte (teal/or/rouge sur fond blanc) — ces animations doivent marquer le moment sans devenir criardes.

## 3. RÈGLE DE CONFIDENTIALITÉ DES BADGES NON DÉBLOQUÉS

Important, vérifie et corrige si besoin : le contenu détaillé d'un badge non débloqué (son nom précis, son critère exact de déblocage, son visuel complet) ne doit être visible QUE dans la Salle des badges — nulle part ailleurs dans l'app. Concrètement :
- Sur l'avatar (médaillon badge actif) : seul un badge DÉJÀ débloqué peut être affiché/choisi comme badge actif — un badge verrouillé ne doit jamais pouvoir être sélectionné ni affiché en médaillon.
- Dans toute notification ou aperçu ailleurs que la Salle des badges : ne jamais révéler le nom ou le visuel précis d'un badge non débloqué.
- Dans la Salle des badges elle-même : les badges non débloqués restent visibles mais grisés/estompés avec seulement la barre de progression (ex: "3/5"), pas de détail supplémentaire qui casse la surprise de la découverte.

## 4. AUDIT FONCTIONNEL COMPLET — VÉRIFIER QUE TOUT CE QUI A ÉTÉ DEMANDÉ FONCTIONNE VRAIMENT

Ne te contente pas de vérifier que le code existe — teste réellement chaque point et confirme le comportement observé, pas supposé. Rapporte pour chacun : fonctionnel / partiellement fonctionnel / non fait, avec le fichier concerné.

### Gamification
1. Le streak s'incrémente-t-il automatiquement quand un étudiant valide sa présence/son cours de la semaine ? Quelle est la règle exacte codée pour "semaine assidue" ?
2. Les badges se débloquent-ils automatiquement selon des règles réelles (ex: 5 semaines de streak = badge), ou faut-il une action manuelle ?
3. La Salle des badges affiche-t-elle une vraie progression en temps réel qui se met à jour après chaque action pertinente ?
4. Le certificat se génère-t-il automatiquement à la fin d'un cycle, ou faut-il le déclencher manuellement ?
5. Le verset du jour change-t-il vraiment chaque jour (pas à chaque rechargement de page) ?
6. Le badge actif choisi par l'étudiant s'affiche-t-il bien en médaillon sur son avatar partout dans l'app, en respectant la règle de confidentialité du point 3 ci-dessus ?

### Animations et vie de l'app
7. Halo doré + scale au déblocage de badge : implémenté et déclenché au bon moment ?
8. Remplissage animé du streak à la validation : implémenté ?
9. Symboles christocentriques en filigrane par section (croix/flamme/livre/mains/couronne) : tous présents ou certains manquants ?
10. Bandeau accent dimanche vs semaine : implémenté ?
11. Marquee de photos sur la landing : fonctionnel, avec pause au survol et avatar par défaut si pas de photo ?

### Rôles et permissions (changements récents)
12. Le modérateur n'a-t-il PLUS aucun droit d'écriture sur les cours ni sur les corrections de soumissions (vérifier RLS, pas juste l'interface visible) ?
13. L'admin peut-il bien ajouter un cours par lien externe OU par upload direct, et le supprimer ?
14. L'admin peut-il bien corriger/noter les soumissions (devoirs, exercices, notes manuscrites) ?
15. Le modérateur peut-il publier des annonces visibles par les étudiants de sa/ses classe(s) ?

### Messagerie
16. Les messages apparaissent-ils vraiment en instantané (testé avec deux sessions ouvertes en parallèle), pas juste après rechargement ?
17. Un modérateur peut-il démarrer une conversation avec un étudiant hors de sa/ses classe(s) assignée(s) ? (ne doit pas être possible — vérifier RLS)
18. Y a-t-il un indicateur visuel de message non lu ?

### Inscription et données
19. Le formulaire d'inscription en 2 étapes fonctionne-t-il de bout en bout (29 champs de l'étape 2 bien enregistrés) ?
20. Le webhook vers le Google Sheet de Pasteur Mike est-il branché et testé (une inscription réelle apparaît bien dans le Sheet) ?
21. La ligne de conduite de l'étudiant (règlement + case ENGAGEMENT) est-elle bien présentée avant la validation de l'inscription ?

### Contenu réel
22. Les programmes de cours réels (dates, titres, objectifs des 3 classes) ont-ils été intégrés en base, ou reste-t-il des données de test/placeholder ?
23. Les vidéos YouTube du fichier media_cours_academie.json sont-elles bien rattachées aux bons cours ?
24. Où en est la migration des audios Google Drive vers le bucket Supabase — fait, partiel, ou pas commencé ?

Fais un rapport complet, point par point, sans sauter de question même si la réponse est "non fait" — je préfère un état des lieux honnête complet plutôt qu'un résumé optimiste partiel.

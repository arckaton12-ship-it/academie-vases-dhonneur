# CONSIGNE — VÉRIFICATIONS + MASCOTTE COMPAGNON + NOTIFICATIONS PUSH

## PARTIE A — VÉRIFICATIONS DES CORRECTIONS RÉCENTES

### A.1 Test réel de connexion modérateur
Fais tester par un vrai compte modérateur récemment réparé (parmi les 28 comptes orphelins corrigés) : connexion avec le mot de passe temporaire, confirmation de l'écran de changement de mot de passe forcé, puis accès normal à l'app. Rapporte le résultat exact, pas une supposition.

### A.2 Liste complète des étudiants côté admin
Confirme par un test réel que TOUS les étudiants (les ~26 anciennement sans classe + les nouveaux inscrits depuis) apparaissent bien dans le dashboard admin sans filtre actif, avec le rafraîchissement automatique (Realtime) qui fonctionne bien si un nouvel étudiant s'inscrit pendant que l'admin a la page ouverte.

### A.3 Vérification des 14 cours sans média
Liste explicitement les 14 cours actuellement sans `audio_url`/`video_url`, avec leur titre et leur classe, pour confirmer qu'il s'agit bien uniquement de : prise de contact, rattrapage, examens, graduation — et qu'aucun vrai cours de contenu ne s'est glissé dedans par erreur.

### A.4 Audit des animations et améliorations d'interface déjà demandées
Revérifie concrètement (pas juste "c'est dans le code") que ce qui suit est bien visible et fonctionnel en production :
- Skeleton loaders sur tous les écrans de chargement
- Swipe entre les onglets du dashboard étudiant
- Transitions de page (fade/glissement)
- Compteurs animés (count-up) sur le tableau de bord
- Retour tactile sur les boutons (scale au clic)
- Messagerie : glissement des messages + indicateur "en train d'écrire"
- Micro-célébration à la soumission d'un devoir

Si un de ces points n'est pas au niveau attendu (trop discret, absent, ou cassé), signale-le précisément.

---

## PARTIE B — MASCOTTE COMPAGNON (inspiré Duolingo, adapté à notre contexte)

**Objectif** : donner à l'app un personnage compagnon original qui interagit avec l'étudiant en temps réel, pour créer un attachement émotionnel qui renforce la motivation — sans copier le personnage de Duolingo (protégé), et sans tomber dans un ton "guilt-tripping"/agressif qui ne correspond pas à l'esprit pastoral de l'app.

### B.1 Conception du personnage
Crée un personnage original cohérent avec l'univers déjà établi (torche/flamme comme signature du streak, symboles christocentriques par section). Proposition : une **petite flamme vivante** (cohérente avec la torche déjà utilisée) avec un visage simple et chaleureux (traits linéaires fins, cohérents avec le style graphique de l'app, pas un dessin cartoon enfantin) — à défaut, une colombe stylisée (symbole du Saint-Esprit, cohérent avec le contexte biblique) fonctionnerait aussi. Choisis celui qui s'intègre le mieux visuellement, et donne-lui un nom simple et chaleureux (à proposer).

Le personnage doit avoir plusieurs **états émotionnels** avec une micro-animation propre à chacun :
- **Content/encourageant** (état par défaut) — apparaît sur le dashboard
- **Fier/célébrant** — au déblocage d'un badge, à la fin d'un cours, à la soumission d'un devoir
- **Attentif/inquiet léger** (jamais culpabilisant ni triste au point d'être pesant) — si le streak est sur le point de se casser (ex: dimanche soir, cours pas encore suivi) : un ton d'encouragement chaleureux ("Ta série t'attend, on y va ensemble ?"), jamais un ton de reproche
- **Accueillant** — à la première connexion et à l'inscription

### B.2 Présence dans l'app
- Sur le dashboard étudiant : le personnage apparaît dans un coin (discret mais visible), avec une bulle de texte contextuelle qui change selon le moment (verset du jour, encouragement, félicitation)
- Anime légèrement le personnage au chargement de page (petit mouvement, clignement) pour donner une impression de vie, sans qu'il soit distrayant en permanence
- Le personnage peut réagir en temps réel à certaines actions : soumission d'un devoir → animation de célébration courte ; badge débloqué → le personnage saute/pulse de joie
- Utilise-le aussi dans le splash screen et l'animation de bienvenue déjà en place, pour créer une cohérence de personnage dès la première seconde

### B.3 Ton des messages du personnage
Rédige une banque de messages courts et variés (pas de répétition monotone), dans un ton chaleureux et fraternel, jamais culpabilisant :
- Encouragements neutres : "Prêt pour le cours de cette semaine ?"
- Célébrations : "Bien joué, tu as tenu ta série !"
- Rappels doux (jamais alarmistes) : "Ta série t'attend — le cours est là quand tu es prêt."

---

## PARTIE C — NOTIFICATIONS PUSH TYPE WHATSAPP

**Important, à comprendre avant l'implémentation** : sur une PWA (progressive web app, pas une app native téléchargée depuis un store), il y a une vraie différence entre deux situations, à traiter différemment :

### C.1 App ouverte (au premier plan)
Là, on peut tout faire, y compris un **son personnalisé** :
- Utilise Supabase Realtime (déjà en place pour la messagerie) pour détecter l'événement en direct
- Affiche une bannière de notification in-app en haut de l'écran (glissement depuis le haut, comme WhatsApp), avec l'avatar de l'expéditeur, un extrait du message, disparaît après quelques secondes ou au clic
- Joue un son personnalisé via Web Audio API (le carillon doux déjà utilisé pour les badges peut être réutilisé ou décliné, ou un son différent pour les messages)
- Déclenche la vibration légère déjà en place sur mobile

### C.2 App fermée ou en arrière-plan (vraies notifications push)
Ça nécessite une vraie infrastructure de push web, plus lourde à mettre en place :
- Implémente les **Web Push Notifications** via un Service Worker (déjà présent puisque l'app est une PWA) combiné à **Firebase Cloud Messaging (FCM)**, qui est la solution la plus fiable et éprouvée pour du push cross-plateforme sur PWA (fonctionne sur Android de façon fiable ; sur iOS, le support existe depuis iOS 16.4+ mais reste plus limité)
- Il faut : un projet Firebase configuré, la clé VAPID, un Service Worker qui écoute les événements push, et une Edge Function Supabase qui déclenche l'envoi via FCM quand un événement pertinent survient (nouveau message, cours disponible, badge débloqué)
- **Limite honnête à connaître et à ne pas cacher au commanditaire** : le son de la notification, quand l'app est fermée, est généralement le son par défaut du système (pas un fichier audio personnalisé comme sur WhatsApp natif) — c'est une limitation des navigateurs web, pas un manque d'effort. La vibration, elle, peut être personnalisée (motif de vibration).
- Demande la permission de notification à l'étudiant de façon non intrusive (pas au premier chargement — au moment où c'est pertinent, ex: après avoir envoyé son premier message ou reçu son premier badge, avec une explication claire de pourquoi l'activer)

### C.3 Contenu des notifications
Déclenche une notification (in-app + push) pour :
- Nouveau message reçu (messagerie)
- Nouveau cours disponible pour sa classe
- Devoir noté / soumission corrigée
- Badge débloqué
- Annonce publiée par son modérateur
- Rappel doux si le streak risque de se casser (formulé par le personnage compagnon, cf partie B)

Rapporte pour chaque partie (A, B, C, D) ce qui est fait, testé, et confirmé — et signale explicitement toute limitation technique rencontrée plutôt que de la passer sous silence.

---

## PARTIE D — REFONTE DE L'INTERFACE ÉTUDIANT UNIQUEMENT (inspirée du "Path" Duolingo)

**Important — périmètre strict** : cette refonte concerne UNIQUEMENT l'interface du profil étudiant (onglet Académie principalement). Ne touche à AUCUNE interface modérateur ou administrateur — elles restent exactement comme elles sont.

**Règle absolue — refonte visuelle, pas refonte fonctionnelle** : c'est une amélioration de PRÉSENTATION uniquement. Toute la logique déjà fonctionnelle et testée doit continuer à marcher exactement pareil après cette refonte :
- Le chargement des cours réels depuis la base (`getClassCourses`), les vraies dates, les vrais médias mappés, le statut verrouillé/disponible/complété — toute cette logique existe déjà et fonctionne, NE LA RÉÉCRIS PAS. Change uniquement la façon dont ces données sont affichées à l'écran (le composant visuel), pas la façon dont elles sont récupérées ou calculées.
- Ne touche à aucune fonction dans `src/lib/courses.ts` sauf si strictement nécessaire pour exposer une donnée déjà existante différemment
- Ne modifie aucune table ni policy RLS pour cette partie
- Après implémentation, relance un test complet du parcours étudiant (voir un cours disponible, l'ouvrir, soumettre un résumé/devoir, voir le statut passer à "complété") pour confirmer que RIEN de fonctionnel n'a été cassé par le changement visuel — le chemin doit être une nouvelle peau sur la logique existante, pas une réécriture.
- Si un doute existe sur comment adapter le visuel sans toucher à la logique, privilégie la prudence : garde la logique intacte et adapte uniquement le rendu JSX/CSS autour.

### D.1 Le concept du "Chemin" (Path)
Remplace la liste actuelle des cours par une visualisation en **chemin vertical/sinueux**, inspirée du design actuel de Duolingo (recherche effectuée : Duolingo a abandonné son ancien système d'arbre complexe pour un chemin linéaire unique, plus clair) :

- Chaque semaine de cours = un **nœud circulaire** sur le chemin, dans l'ordre chronologique du programme réel de la classe
- États visuels distincts pour chaque nœud :
  - **Verrouillé/à venir** : grisé, estompé
  - **Disponible maintenant** : coloré (teal/or), légèrement mis en avant (peut-être une pulsation douce pour attirer l'œil)
  - **Complété** : coloré avec une coche ou un symbole de validation, cohérent avec la charte
- Le chemin serpente verticalement (pas horizontalement, pour un usage mobile-first), avec une légère courbe gauche-droite entre les nœuds pour casser la monotonie d'une ligne droite (comme le fait Duolingo)
- Regroupe les nœuds par "unité" cohérente si pertinent (ex: par mois, ou par grande thématique du programme), avec un petit en-tête de section sur le chemin

### D.2 Le personnage compagnon sur le chemin
Le personnage compagnon (cf. partie B) apparaît directement positionné sur le chemin, à l'endroit correspondant à la progression actuelle de l'étudiant — donne une impression tangible de "voyage" à travers le programme, pas juste une liste abstraite.

### D.3 Interaction avec un nœud
Au clic sur un nœud de cours :
- Si verrouillé (semaine future) : légère animation de "secousse" ou message du personnage compagnon ("Pas encore, cette semaine arrive bientôt !") plutôt qu'un simple clic sans effet
- Si disponible : ouverture directe du cours (lecteur audio/vidéo, résumé, devoirs) tel qu'actuellement, mais avec une transition d'ouverture plus travaillée (le nœud qui s'agrandit vers l'écran de cours, plutôt qu'un changement de page brutal)
- Si complété : ouverture du cours en mode "révision", avec accès au résumé déjà écrit et à la note reçue

### D.4 Cohérence avec l'existant
- Conserve la palette teal/or/rouge sur fond blanc — ne pas basculer vers les couleurs saturées vives de Duolingo (vert/bleu/violet), l'inspiration porte sur la STRUCTURE et l'INTERACTION, pas sur la charte chromatique
- Conserve tous les éléments déjà en place ailleurs dans le profil étudiant (streak, salle des badges, page Revue, Service, Paramètres) — cette refonte concerne spécifiquement la présentation des cours dans l'onglet Académie, pas une refonte totale de toutes les pages
- Garde la barre de recherche de cours existante, accessible en haut du chemin ou via un bouton dédié (elle reste utile même avec la nouvelle présentation visuelle)

### D.5 Test de validation — non-régression obligatoire
Avant de considérer cette partie terminée :
1. Fais valider visuellement (capture d'écran ou description précise) que le chemin s'affiche correctement avec au moins un nœud verrouillé, un disponible, et un complété, pour un compte étudiant de test avec de la progression réelle.
2. Confirme explicitement, par un test réel, que tout ce qui fonctionnait avant (streaming audio/vidéo, téléchargement audio, résumé, soumission de devoir, mini-tâche pratique, tableau de bord) fonctionne toujours EXACTEMENT pareil après la refonte visuelle — liste chaque fonctionnalité vérifiée avec son statut.
3. Si quoi que ce soit s'est cassé pendant la refonte, corrige-le avant de rapporter la partie D comme terminée — ne rapporte jamais une amélioration visuelle comme "faite" si elle a introduit une régression fonctionnelle.

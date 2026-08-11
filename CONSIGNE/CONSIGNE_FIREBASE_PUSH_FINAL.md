# CONSIGNE — CONFIGURATION FIREBASE CLOUD MESSAGING (notifications push app fermée)

## 0. SÉCURITÉ — PRIORITÉ ABSOLUE AVANT TOUT

Le fichier de compte de service Firebase (nom : `academie-vases-dhonneur-firebase-adminsdk-fbsvc-3a2eb11198.json`, ou nom approchant selon l'extension exacte) va être placé directement dans le dossier du projet par l'utilisateur.

**Avant toute autre étape** :
1. Ajoute immédiatement ce fichier (par son nom exact et par un pattern générique `*firebase-adminsdk*.json`) au `.gitignore` à la racine du projet
2. Vérifie qu'il n'a pas déjà été commit par erreur — si le fichier a été ajouté avant cette étape, vérifie l'historique git et purge-le si nécessaire (`git rm --cached` puis commit, ou réécriture d'historique si déjà poussé sur GitHub)
3. Confirme explicitement que ce fichier ne sera JAMAIS envoyé côté client (il ne doit servir que côté serveur — dans une Edge Function Supabase, jamais dans le bundle JS de l'app React)

Localise ce fichier à la racine du projet (ou dans un sous-dossier que tu confirmeras avec moi si tu ne le trouves pas à la racine) une fois que je te confirme qu'il est en place.

## 1. CONFIGURATION FIREBASE CÔTÉ CLIENT

Voici les informations du projet Firebase (informations publiques, sans risque à embarquer côté client) :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAeSiYt1qNVkxQxVxQ4-mB_YTk7c4GJQSU",
  authDomain: "academie-vases-dhonneur.firebaseapp.com",
  projectId: "academie-vases-dhonneur",
  storageBucket: "academie-vases-dhonneur.firebasestorage.app",
  messagingSenderId: "1837792857",
  appId: "1:1837792857:web:5977acda5709b36926bb48"
};
```

Clé VAPID publique :
```
BG85r1i0f1V41z4iCMsnsmFdLU5ENpkcQS_4niz_oenYdg2eQWJua3jb-bKXyRfObueCjJHP2MXkp5RvkVcIsKQ
```

Étapes :
1. Installe le SDK Firebase : `npm install firebase`
2. Crée `src/lib/firebase.ts` avec l'initialisation (`initializeApp(firebaseConfig)`) et l'export de l'instance `messaging` (`getMessaging(app)`)
3. Mets à jour `src/lib/pushNotifications.ts` existant :
   - Remplace `const VAPID_KEY = ''` par la vraie clé VAPID ci-dessus
   - Implémente `getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration })` pour récupérer le token FCM de l'appareil de l'étudiant
   - Stocke ce token dans une nouvelle table Supabase `push_tokens` (colonnes : `user_id`, `token`, `created_at`, `updated_at`) — un utilisateur peut avoir plusieurs tokens (plusieurs appareils)
4. Crée `public/firebase-messaging-sw.js` (Service Worker dédié à FCM, séparé ou fusionné avec `sw.js` existant selon ce qui est le plus propre) qui gère la réception des messages en arrière-plan (`onBackgroundMessage`)

## 2. DEMANDE DE PERMISSION — NON INTRUSIVE

Implémente la demande de permission de notification (`Notification.requestPermission()`) de façon différée et contextuelle :
- PAS au chargement de l'app ni à l'inscription
- Déclenche-la après la première action significative de l'étudiant (premier message envoyé dans la messagerie, ou premier badge obtenu), avec une explication claire avant de déclencher le popup navigateur : par exemple une petite carte "Active les notifications pour ne rien manquer" avec un bouton "Activer" qui déclenche la vraie demande de permission seulement au clic

## 3. EDGE FUNCTION SUPABASE — ENVOI DES NOTIFICATIONS

Crée une Edge Function Supabase (ex: `send-push-notification`) qui :
1. Utilise le fichier de compte de service Firebase (lu côté serveur uniquement, jamais exposé) pour s'authentifier auprès de l'API FCM HTTP v1
2. Récupère le(s) token(s) FCM du destinataire depuis la table `push_tokens`
3. Envoie la notification via l'API FCM

Déclenche l'appel à cette Edge Function pour ces événements (réutilise les triggers/webhooks déjà en place quand c'est possible) :
- Nouveau message reçu (messagerie)
- Nouveau cours disponible pour sa classe
- Devoir noté / soumission corrigée
- Badge débloqué
- Annonce publiée par le modérateur/admin
- Rappel doux si le streak risque de se casser (formulé par la mascotte, cf. consigne précédente)

## 4. TEST RÉEL OBLIGATOIRE

Ne rapporte cette consigne comme terminée qu'après un test réel confirmé :
- Ouvre l'app sur un vrai téléphone (ou navigateur desktop), accepte la permission de notification
- Ferme complètement l'app (pas juste l'onglet en arrière-plan — vraiment fermée)
- Déclenche un événement depuis un autre compte (ex: envoie un message depuis un compte modérateur test)
- Confirme que la notification apparaît bien sur l'appareil malgré l'app fermée

Rapporte le résultat exact de ce test, avec le type d'appareil/navigateur utilisé. Rappelle la limite déjà connue : le son sera celui par défaut du système, pas un son personnalisé (limitation des navigateurs web pour les notifications en arrière-plan, pas un manque d'implémentation).

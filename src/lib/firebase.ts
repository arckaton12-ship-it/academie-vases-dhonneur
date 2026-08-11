import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyAeSiYt1qNVkxQxVxQ4-mB_YTk7c4GJQSU",
  authDomain: "academie-vases-dhonneur.firebaseapp.com",
  projectId: "academie-vases-dhonneur",
  storageBucket: "academie-vases-dhonneur.firebasestorage.app",
  messagingSenderId: "1837792857",
  appId: "1:1837792857:web:5977acda5709b36926bb48"
}

const app = initializeApp(firebaseConfig)

let messaging: ReturnType<typeof getMessaging> | null = null

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app)
}

export { app, messaging }

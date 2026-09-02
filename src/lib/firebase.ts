import { initializeApp } from 'firebase/app'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyAeSiYt1qNVkxQxVxQ4-mB_YTk7c4GJQSU",
  authDomain: "academie-vases-dhonneur.firebaseapp.com",
  projectId: "academie-vases-dhonneur",
  storageBucket: "academie-vases-dhonneur.firebasestorage.app",
  messagingSenderId: "1837792857",
  appId: "1:1837792857:web:5977acda5709b36926bb48"
}

const app = initializeApp(firebaseConfig)

let messagingInstance: ReturnType<typeof getMessaging> | null = null
let messagingPromise: Promise<ReturnType<typeof getMessaging> | null> | null = null

export function getMessagingInstance(): Promise<ReturnType<typeof getMessaging> | null> {
  if (messagingInstance !== null) return Promise.resolve(messagingInstance)
  if (!messagingPromise) {
    messagingPromise = isSupported()
      .then((supported) => {
        if (!supported) return null
        messagingInstance = getMessaging(app)
        return messagingInstance
      })
      .catch(() => null)
  }
  return messagingPromise
}

export { app }

import { getToken, onMessage } from 'firebase/messaging'
import { getMessagingInstance } from './firebase'
import { supabase } from './supabase'

const VAPID_KEY = 'BG85r1i0f1V41z4iCMsnsmFdLU5ENpkcQS_4niz_oenYdg2eQWJua3jb-bKXyRfObueCjJHP2MXkp5RvkVcIsKQ'

export async function isPushSupported(): Promise<boolean> {
  try {
    const messaging = await getMessagingInstance()
    return !!messaging && 'Notification' in window && 'serviceWorker' in navigator
  } catch {
    return false
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  } catch {
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

export async function getAndSavePushToken(_userId: string): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return null
    return null
  } catch {
    return null
  }
}

export async function registerPushAfterConsent(userId: string): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const reg = await registerServiceWorker()
    if (!reg) return null

    const permission = await requestNotificationPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: reg,
    })

    if (token) {
      await supabase.from('push_tokens').upsert(
        { user_id: userId, token, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,token' }
      )
    }

    return token
  } catch {
    return null
  }
}

export function onForegroundMessage(callback: (payload: { title: string; body: string }) => void): (() => void) | undefined {
  let unsub: (() => void) | undefined
  getMessagingInstance().then((messaging) => {
    if (!messaging) return
    unsub = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? ''
      const body = payload.notification?.body ?? ''
      if (title) callback({ title, body })
    })
  }).catch(() => {})
  return () => { unsub?.() }
}

export async function showLocalNotification(title: string, body: string, icon?: string) {
  if (Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    reg.showNotification(title, {
      body,
      icon: icon ?? '/logo.png',
      badge: '/logo.png',
      tag: `academy-${Date.now()}`,
    } as NotificationOptions & { vibrate?: number[] })
  } catch {
    // silent fail
  }
}

// Web Push Notification Manager
// Handles Service Worker registration, permission requests, and token management

const VAPID_KEY = '' // To be configured with Firebase VAPID key

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
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

export async function getPushToken(): Promise<string | null> {
  if (!('PushManager' in window)) return null
  try {
    const reg = await navigator.serviceWorker.ready
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_KEY || undefined,
    })
    return JSON.stringify(subscription)
  } catch {
    return null
  }
}

export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
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
    // SW not available, silently fail
  }
}

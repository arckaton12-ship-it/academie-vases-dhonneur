import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast, toastError } from '@/components/ui/Toast'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// VAPID keys - generate your own with: npx web-push generate-vapid-keys
// For now using a placeholder - replace with real keys in production
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxVkv99Bk0NNJY1w4BOCWkS3JgOydP9XmVpBGR5cYq8RCKG5eKJbJFhHp7fNqGKJqJFhHp7fNqG'

export function usePushNotifications() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported) return
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        toastError('Notifications bloquees. Autorise-les dans les parametres du navigateur.')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Store subscription in Supabase
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      await supabase.from('push_subscriptions').upsert({
        user_id: userData.user.id,
        subscription: JSON.parse(JSON.stringify(subscription)),
        endpoint: subscription.endpoint,
      }, { onConflict: 'user_id' })

      setSubscribed(true)
      toast('Notifications activees !')
    } catch (e: any) {
      console.error('[Push] subscribe error:', e)
      toastError('Impossible d\'activer les notifications.')
    }
  }, [supported])

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          await supabase.from('push_subscriptions').delete().eq('user_id', userData.user.id)
        }
      }
      setSubscribed(false)
      toast('Notifications desactivees.')
    } catch (e: any) {
      console.error('[Push] unsubscribe error:', e)
    }
  }, [])

  return { supported, permission, subscribed, subscribe, unsubscribe }
}

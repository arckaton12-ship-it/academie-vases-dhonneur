import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { playSuccess } from '@/lib/sound'

export interface InAppNotification {
  id: string
  title: string
  body: string
  icon?: string
  type: 'message' | 'course' | 'badge' | 'assignment' | 'announcement' | 'streak'
  timestamp: number
}

interface UseInAppNotificationsOptions {
  userId?: string
  onNotification?: (notif: InAppNotification) => void
}

export function useInAppNotifications({ userId, onNotification }: UseInAppNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [current, setCurrent] = useState<InAppNotification | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    setCurrent(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const show = useCallback((notif: InAppNotification) => {
    setCurrent(notif)
    setNotifications((prev) => [notif, ...prev].slice(0, 50))
    onNotification?.(notif)
    // Vibrate on mobile
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    // Auto-dismiss after 5s
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(dismiss, 5000)
  }, [dismiss, onNotification])

  // Listen for new messages via Realtime
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('in-app-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as { sender_id?: string; content?: string }
        if (msg.sender_id === userId) return // Don't notify for own messages
        show({
          id: `msg-${Date.now()}`,
          title: 'Nouveau message',
          body: msg.content?.slice(0, 80) ?? 'Tu as reçu un message.',
          type: 'message',
          timestamp: Date.now(),
        })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = payload.new as { title?: string; message?: string; type?: string }
        show({
          id: `notif-${Date.now()}`,
          title: n.title ?? 'Notification',
          body: n.message ?? '',
          type: (n.type as InAppNotification['type']) ?? 'announcement',
          timestamp: Date.now(),
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, show])

  return { notifications, current, dismiss, show }
}

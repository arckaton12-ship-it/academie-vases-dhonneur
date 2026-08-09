import { supabase } from './supabase'

export interface Notification {
  id: string
  user_id: string
  type: 'message' | 'annonce' | 'correction' | 'devoir' | 'badge' | 'cours' | 'systeme'
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

export async function getNotifications(): Promise<Notification[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function getUnreadCount(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return 0
  const { data, error } = await supabase.rpc('get_unread_notification_count', {
    p_user_id: userData.user.id,
  })
  if (error) return 0
  return (data as number) ?? 0
}

export async function markAllRead(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return
  await supabase.rpc('mark_all_notifications_read', {
    p_user_id: userData.user.id,
  })
}

export async function markRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
}

// Helper: create notification via RPC
export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  body?: string,
  link?: string
): Promise<void> {
  await supabase.rpc('create_notification', {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_body: body ?? null,
    p_link: link ?? null,
  })
}

// Notify all students of a class
export async function notifyClass(
  classId: string,
  type: Notification['type'],
  title: string,
  body?: string,
  link?: string
): Promise<void> {
  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('class_id', classId)
    .eq('role', 'ETUDIANT')
    .eq('active', true)
  if (!students) return
  for (const s of students) {
    await createNotification(s.id, type, title, body, link)
  }
}

// Notify a single user
export async function notifyUser(
  userId: string,
  type: Notification['type'],
  title: string,
  body?: string,
  link?: string
): Promise<void> {
  await createNotification(userId, type, title, body, link)
}

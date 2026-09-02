import { supabase } from './supabase'
import { getSafeSession } from './auth'

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function markNotificationsRead() {
  const session = getSafeSession()
  if (!session) return
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', session.user.id)
    .eq('read', false)
  if (error) throw error
}

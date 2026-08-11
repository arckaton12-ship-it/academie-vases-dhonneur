import { supabase } from './supabase'

interface SendPushParams {
  userId: string
  title: string
  body: string
  tag?: string
  url?: string
}

export async function sendPushNotification({ userId, title, body, tag, url }: SendPushParams): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) return

    await supabase.functions.invoke('send-push-notification', {
      body: { user_id: userId, title, body, tag, url },
    })
  } catch {
    // silent fail — push is best-effort
  }
}

export async function sendPushToRole(
  role: 'student' | 'moderator' | 'admin',
  title: string,
  body: string,
  tag?: string,
  url?: string
): Promise<void> {
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', role)

    if (!profiles) return

    for (const { id } of profiles) {
      await sendPushNotification({ userId: id, title, body, tag, url })
    }
  } catch {
    // silent fail
  }
}

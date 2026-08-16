import { supabase } from './supabase'

export interface Conversation {
  id: string
  type: 'DIRECT' | 'MODERATEUR_ETUDIANT' | 'MODERATEUR_MODERATEUR' | 'SERVICE_GROUP'
  participant_1: string
  participant_2: string
  created_at: string
  service_group_key?: string | null
  other_user?: { id: string; first_name: string; last_name: string; avatar_url: string | null } | null
  last_message?: { content: string; sent_at: string; sender_id: string } | null
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  sent_at: string
  read_at: string | null
  client_id?: string
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}

// Rate limiter: max 1 message per 500ms per conversation
const lastSendTimes: Record<string, number> = {}
function canSend(conversationId: string): boolean {
  const now = Date.now()
  const last = lastSendTimes[conversationId] ?? 0
  if (now - last < 500) return false
  lastSendTimes[conversationId] = now
  return true
}

function generateClientId(): string {
  return `cid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function getConversations(): Promise<Conversation[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []
  const userId = userData.user.id

  const { data: me } = await supabase
    .from('profiles')
    .select('class_id, department')
    .eq('id', userId)
    .maybeSingle()

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error

  let convos = (data ?? []) as Conversation[]

  if (me?.class_id && me?.department) {
    const groupKey = `${me.class_id}:${me.department}`
    const { data: serviceConvos } = await supabase
      .from('conversations')
      .select('*')
      .eq('type', 'SERVICE_GROUP')
      .eq('service_group_key', groupKey)
    const existingIds = new Set(convos.map(c => c.id))
    for (const sc of serviceConvos ?? []) {
      if (!existingIds.has(sc.id)) convos.push(sc as Conversation)
    }
  }

  const otherIds = new Set<string>()
  for (const c of convos) {
    if (c.type !== 'SERVICE_GROUP') {
      otherIds.add(c.participant_1 === userId ? c.participant_2 : c.participant_1)
    }
  }
  const conversationIds = convos.map(c => c.id)

  const profileIds = [...otherIds]
  const [{ data: profiles }, { data: allMessages }, { data: unreadMessages }] = await Promise.all([
    profileIds.length > 0
      ? supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    conversationIds.length > 0
      ? supabase
          .from('messages')
          .select('conversation_id, content, sent_at, sender_id')
          .in('conversation_id', conversationIds)
          .order('sent_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    conversationIds.length > 0
      ? supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .neq('sender_id', userId)
          .is('read_at', null)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))

  const lastMsgMap = new Map<string, { content: string; sent_at: string; sender_id: string }>()
  for (const msg of allMessages ?? []) {
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, { content: msg.content, sent_at: msg.sent_at, sender_id: msg.sender_id })
    }
  }

  const unreadMap = new Map<string, number>()
  for (const msg of unreadMessages ?? []) {
    unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) ?? 0) + 1)
  }

  const enriched = convos.map((c) => {
    let other_user: Conversation['other_user'] = null

    if (c.type === 'SERVICE_GROUP' && c.service_group_key) {
      const dept = c.service_group_key.split(':')[1] || 'Groupe'
      other_user = { id: 'service-group', first_name: dept, last_name: '(Service)', avatar_url: null }
    } else {
      const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1
      other_user = (profileMap.get(otherId) as Conversation['other_user']) ?? null
    }

    return {
      ...c,
      other_user,
      last_message: lastMsgMap.get(c.id) ?? null,
      unread_count: unreadMap.get(c.id) ?? 0,
    }
  })

  return enriched.sort((a, b) => {
    const aTime = a.last_message?.sent_at ?? a.created_at
    const bTime = b.last_message?.sent_at ?? b.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true })
    .limit(200)
  if (error) throw error
  return (data ?? []).map((m) => ({ ...m, status: m.read_at ? 'read' : 'delivered' } as Message))
}

export async function sendMessage(
  conversationId: string,
  content: string,
  replyToId?: string,
  optimisticClientId?: string
): Promise<Message> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Non authentifie')

  if (!canSend(conversationId)) {
    throw new Error('Envoi trop rapide. Attends un instant.')
  }

  const clientId = optimisticClientId || generateClientId()

  const insertData: Record<string, unknown> = {
    conversation_id: conversationId,
    sender_id: userData.user.id,
    content: content.trim(),
    client_id: clientId,
  }
  if (replyToId) insertData.reply_to_id = replyToId

  const { data, error } = await supabase
    .from('messages')
    .insert(insertData)
    .select()
    .single()
  if (error) throw error

  return { ...data, status: 'sent' } as Message
}

export async function markAsRead(conversationId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userData.user.id)
    .is('read_at', null)
  if (error) throw error
}

export async function createConversation(
  participantId: string,
  _type?: string
): Promise<Conversation> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Non authentifie')

  // Check for existing conversation first
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(participant_1.eq.${userData.user.id},participant_2.eq.${participantId}),and(participant_1.eq.${participantId},participant_2.eq.${userData.user.id})`)
    .maybeSingle()

  if (existing) return existing as Conversation

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      type: 'DIRECT',
      participant_1: userData.user.id,
      participant_2: participantId,
    })
    .select()
    .single()
  if (error) throw error
  return data as Conversation
}

export async function getOrCreateServiceGroupConversation(classId: string, department: string): Promise<Conversation> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Non authentifié')
  const groupKey = `${classId}:${department}`
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('service_group_key', groupKey)
    .eq('type', 'SERVICE_GROUP')
    .maybeSingle()
  if (existing) return existing as Conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      type: 'SERVICE_GROUP',
      participant_1: userData.user.id,
      participant_2: userData.user.id,
      service_group_key: groupKey,
    })
    .select()
    .single()
  if (error) throw error
  return data as Conversation
}

export async function getServiceGroupMembers(classId: string, department: string): Promise<Contact[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, role')
    .eq('class_id', classId)
    .eq('department', department)
    .eq('active', true)
  return (data ?? []) as Contact[]
}

export function subscribeToMessages(
  conversationId: string,
  callback: (msg: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback({ ...payload.new as Message, status: 'delivered' })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  role: string
}

export async function updateMyStatus(): Promise<void> {
  await supabase.rpc('update_user_status')
}

export async function getUserOnlineStatus(userId: string): Promise<{ is_online: boolean; last_seen: string } | null> {
  const { data } = await supabase.rpc('get_user_status', { p_user_id: userId })
  if (!data || data.length === 0) return null
  return { is_online: data[0].is_online, last_seen: data[0].last_seen }
}

export async function getAvailableContacts(): Promise<Contact[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []
  const userId = userData.user.id

  const { data: me } = await supabase
    .from('profiles')
    .select('role, class_id')
    .eq('id', userId)
    .single()
  if (!me) return []

  if (me.role === 'ETUDIANT') {
    const { data } = await supabase
      .from('moderator_classes')
      .select('moderator_id, profiles:moderator_id(id, first_name, last_name, avatar_url, role)')
      .eq('class_id', me.class_id)
    return (data ?? [])
      .map((r: any) => r.profiles)
      .filter(Boolean) as Contact[]
  }

  if (me.role === 'MODERATEUR') {
    const { data: myClasses } = await supabase
      .from('moderator_classes')
      .select('class_id')
      .eq('moderator_id', userId)
    const classIds = (myClasses ?? []).map((r: any) => r.class_id)
    if (classIds.length === 0) return []
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role')
      .in('class_id', classIds)
      .eq('role', 'ETUDIANT')
      .eq('active', true)
    return (data ?? []) as Contact[]
  }

  if (me.role === 'ADMIN_CLASSE') {
    const { data: myClasses } = await supabase
      .from('admin_class_classes')
      .select('class_id')
      .eq('admin_id', userId)
    const classIds = (myClasses ?? []).map((r: any) => r.class_id)
    if (classIds.length === 0) return []
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role')
      .in('class_id', classIds)
      .eq('role', 'ETUDIANT')
      .eq('active', true)
    return (data ?? []) as Contact[]
  }

  // Admin: all active users except self
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, role')
    .neq('id', userId)
    .eq('active', true)
  return (data ?? []) as Contact[]
}

export async function sendBroadcastMessage(content: string): Promise<{ sent: number }> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'ADMINISTRATEUR') throw new Error('Non autorisé')

  const { data: recipients } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', userData.user.id)
    .eq('active', true)

  if (!recipients || recipients.length === 0) return { sent: 0 }

  let sent = 0
  for (const r of recipients) {
    try {
      await createConversation(r.id, 'DIRECT')
      const convs = await getConversations()
      const conv = convs.find(
        (c) =>
          (c.participant_1 === userData.user!.id && c.participant_2 === r.id) ||
          (c.participant_1 === r.id && c.participant_2 === userData.user!.id)
      )
      if (conv) {
        await sendMessage(conv.id, content)
        sent++
      }
    } catch {
      // skip failed recipients
    }
  }
  return { sent }
}

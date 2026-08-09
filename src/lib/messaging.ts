import { supabase } from './supabase'

export interface Conversation {
  id: string
  type: 'MODERATEUR_ETUDIANT' | 'MODERATEUR_MODERATEUR'
  participant_1: string
  participant_2: string
  created_at: string
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
}

export async function getConversations(): Promise<Conversation[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []
  const userId = userData.user.id

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error

  const convos = (data ?? []) as Conversation[]

  const enriched = await Promise.all(
    convos.map(async (c) => {
      const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', otherId)
        .single()

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, sent_at, sender_id')
        .eq('conversation_id', c.id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', c.id)
        .neq('sender_id', userId)
        .is('read_at', null)

      return {
        ...c,
        other_user: profile ?? null,
        last_message: lastMsg ?? null,
        unread_count: count ?? 0,
      }
    })
  )

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
  if (error) throw error
  return (data ?? []) as Message[]
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Non authentifié')
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userData.user.id,
      content: content.trim(),
    })
    .select()
    .single()
  if (error) throw error
  return data as Message
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
  type: 'MODERATEUR_ETUDIANT' | 'MODERATEUR_MODERATEUR'
): Promise<Conversation> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Non authentifié')
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      type,
      participant_1: userData.user.id,
      participant_2: participantId,
    })
    .select()
    .single()
  if (error) throw error
  return data as Conversation
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
        callback(payload.new as Message)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

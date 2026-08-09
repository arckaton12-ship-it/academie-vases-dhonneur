import { FormEvent, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/Avatar'
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  createConversation,
  subscribeToMessages,
  Conversation,
  Message,
} from '@/lib/messaging'
import { supabase } from '@/lib/supabase'

interface MessagingPanel {
  currentUserId: string
  userRole: 'ADMINISTRATEUR' | 'MODERATEUR' | 'ETUDIANT'
}

export function MessagingPanel({ currentUserId, userRole }: MessagingPanel) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeId) return
    markAsRead(activeId).then(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, unread_count: 0 } : c))
      )
    })
  }, [activeId])

  useEffect(() => {
    if (!activeId) { setMessages([]); return }
    getMessages(activeId).then(setMessages).catch(() => {})
    const unsub = subscribeToMessages(activeId, (msg) => {
      setMessages((prev) => [...prev, msg])
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, last_message: { content: msg.content, sent_at: msg.sent_at, sender_id: msg.sender_id } }
            : c
        )
      )
    })
    return unsub
  }, [activeId])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !activeId) return
    setSending(true)
    try {
      const msg = await sendMessage(activeId, newMsg.trim())
      setMessages((prev) => [...prev, msg])
      setNewMsg('')
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, last_message: { content: msg.content, sent_at: msg.sent_at, sender_id: msg.sender_id } }
            : c
        )
      )
    } catch {
    } finally {
      setSending(false)
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Hier'
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const activeConvo = conversations.find((c) => c.id === activeId)

  if (loading) {
    return <p className="text-sm text-pierre">Chargement des conversations…</p>
  }

  return (
    <div className="flex h-[600px] overflow-hidden rounded-card border border-pierre/15">
      {/* Sidebar conversations */}
      <div
        className={`w-72 flex-shrink-0 border-r border-pierre/15 bg-white/40 ${
          mobileShowChat ? 'hidden md:block' : 'block'
        }`}
      >
        <div className="border-b border-pierre/15 p-3">
          <p className="font-display text-sm text-bordeaux">Messagerie</p>
        </div>
        {conversations.length === 0 ? (
          <p className="p-4 text-xs text-pierre">Aucune conversation.</p>
        ) : (
          <ul className="overflow-y-auto">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => { setActiveId(c.id); setMobileShowChat(true) }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    activeId === c.id ? 'bg-bordeaux/10' : 'hover:bg-sable/30'
                  }`}
                >
                  <Avatar
                    url={c.other_user?.avatar_url}
                    firstName={c.other_user?.first_name}
                    lastName={c.other_user?.last_name}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-bordeaux">
                      {c.other_user?.first_name} {c.other_user?.last_name}
                    </p>
                    {c.last_message && (
                      <p className="truncate text-[11px] text-pierre">
                        {c.last_message.sender_id === currentUserId ? 'Vous : ' : ''}
                        {c.last_message.content}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {c.last_message && (
                      <span className="text-[10px] text-pierre">
                        {formatDate(c.last_message.sent_at)}
                      </span>
                    )}
                    {(c.unread_count ?? 0) > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-or px-1 text-[10px] font-bold text-bordeaux">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Zone de chat */}
      <div className={`flex flex-1 flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeId ? (
          <div className="flex flex-1 items-center justify-center text-sm text-pierre">
            Sélectionne une conversation.
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-pierre/15 px-4 py-3">
              <button
                onClick={() => setMobileShowChat(false)}
                className="md:hidden text-bordeaux text-xs underline"
              >
                ← Retour
              </button>
              <Avatar
                url={activeConvo?.other_user?.avatar_url}
                firstName={activeConvo?.other_user?.first_name}
                lastName={activeConvo?.other_user?.last_name}
                size={28}
              />
              <p className="text-sm font-medium text-bordeaux">
                {activeConvo?.other_user?.first_name} {activeConvo?.other_user?.last_name}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m) => {
                const isMine = m.sender_id === currentUserId
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                        isMine
                          ? 'bg-bordeaux text-parchemin'
                          : 'bg-sable/40 text-bordeaux'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className={`mt-1 text-[10px] ${isMine ? 'text-parchemin/60' : 'text-pierre'}`}>
                        {formatTime(m.sent_at)}
                        {isMine && m.read_at && ' ✓✓'}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEnd} />
            </div>

            {/* Champ de saisie */}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-pierre/15 px-4 py-3">
              <Input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Écrire un message…"
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMsg.trim()}>
                Envoyer
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

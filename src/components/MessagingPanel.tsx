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
  getAvailableContacts,
  Conversation,
  Message,
  Contact,
} from '@/lib/messaging'

interface MessagingPanelProps {
  currentUserId: string
  userRole: 'ADMINISTRATEUR' | 'MODERATEUR' | 'ETUDIANT'
}

export function MessagingPanel({ currentUserId, userRole }: MessagingPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const messagesContainer = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [showNewConvo, setShowNewConvo] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchContact, setSearchContact] = useState('')
  const [searchConvos, setSearchConvos] = useState('')
  const [isTyping, setIsTyping] = useState(false)

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

  // Focus input when conversation changes
  useEffect(() => {
    if (activeId) inputRef.current?.focus()
  }, [activeId])

  function openNewConvo() {
    setShowNewConvo(true)
    if (contacts.length === 0) {
      getAvailableContacts().then(setContacts).catch(() => {})
    }
  }

  async function startConvo(contact: Contact) {
    try {
      const existing = conversations.find(
        (c) => c.participant_1 === contact.id || c.participant_2 === contact.id
      )
      if (existing) {
        setActiveId(existing.id)
      } else {
        const type = userRole === 'ETUDIANT' ? 'MODERATEUR_ETUDIANT' : 'MODERATEUR_MODERATEUR'
        const convo = await createConversation(contact.id, type)
        const enriched: Conversation = { ...convo, other_user: contact, last_message: null, unread_count: 0 }
        setConversations((prev) => [enriched, ...prev])
        setActiveId(convo.id)
      }
    } catch { /* ignore */ }
    setShowNewConvo(false)
    setMobileShowChat(true)
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !activeId) return
    setSending(true)
    setIsTyping(true)
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
      setIsTyping(false)
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

  function formatLastMsgTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `${diffMins}min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const activeConvo = conversations.find((c) => c.id === activeId)

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0)

  const filteredConvos = conversations.filter((c) => {
    const q = searchConvos.toLowerCase()
    return `${c.other_user?.first_name} ${c.other_user?.last_name}`.toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-card border border-pierre/15">
        <div className="flex items-center gap-2 text-sm text-pierre">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Chargement…
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-[600px] overflow-hidden rounded-card border border-pierre/15 bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-white/5">
      {/* ─── NEW CONVERSATION OVERLAY ─── */}
      {showNewConvo && (
        <div className="absolute inset-0 z-20 flex flex-col rounded-card bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-pierre/15 px-4 py-3 dark:border-white/10">
            <button onClick={() => setShowNewConvo(false)} className="text-pierre hover:text-bordeaux dark:text-slate-400 dark:hover:text-or">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <p className="text-sm font-semibold text-bordeaux dark:text-slate-100">Nouvelle conversation</p>
          </div>
          <div className="px-4 py-2">
            <Input
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              placeholder="Rechercher une personne…"
              className="!bg-sable/30 dark:!bg-white/5"
            />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {contacts
              .filter((c) => {
                const q = searchContact.toLowerCase()
                return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
              })
              .map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => startConvo(c)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sable/30 dark:hover:bg-white/5"
                  >
                    <Avatar url={c.avatar_url} firstName={c.first_name} lastName={c.last_name} size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-bordeaux dark:text-slate-100">{c.first_name} {c.last_name}</p>
                      <p className="text-[11px] capitalize text-pierre dark:text-slate-500">{c.role === 'ETUDIANT' ? 'Étudiant' : c.role === 'MODERATEUR' ? 'Modérateur' : 'Admin'}</p>
                    </div>
                  </button>
                </li>
              ))}
            {contacts.length === 0 && (
              <div className="px-4 py-8 text-center">
                <svg className="mx-auto mb-2 text-pierre/30" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <p className="text-xs text-pierre dark:text-slate-500">Chargement des contacts…</p>
              </div>
            )}
          </ul>
        </div>
      )}

      {/* ─── SIDEBAR CONVERSATIONS ─── */}
      <div
        className={`w-72 flex-shrink-0 border-r border-pierre/15 bg-white/40 dark:bg-slate-900/40 dark:border-white/5 ${
          mobileShowChat ? 'hidden md:block' : 'block'
        }`}
      >
        {/* Header */}
        <div className="border-b border-pierre/15 px-4 py-3 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-bordeaux dark:text-slate-100">Messages</h3>
              {totalUnread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-or px-1.5 text-[10px] font-bold text-bordeaux">
                  {totalUnread}
                </span>
              )}
            </div>
            <button
              onClick={openNewConvo}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-bordeaux text-white transition-colors hover:bg-bordeaux/80 dark:bg-or dark:text-slate-900"
              title="Nouvelle conversation"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          {conversations.length > 3 && (
            <div className="mt-2">
              <Input
                value={searchConvos}
                onChange={(e) => setSearchConvos(e.target.value)}
                placeholder="Rechercher…"
                className="!py-1.5 !text-xs !bg-sable/30 dark:!bg-white/5"
              />
            </div>
          )}
        </div>

        {/* Conversation list */}
        {filteredConvos.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-or/10 text-or/50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-xs text-pierre dark:text-slate-500">
              {conversations.length === 0 ? 'Aucune conversation.' : 'Aucun résultat.'}
            </p>
            {conversations.length === 0 && (
              <button onClick={openNewConvo} className="mt-2 text-xs font-medium text-bordeaux hover:underline dark:text-or">
                Démarrer une conversation
              </button>
            )}
          </div>
        ) : (
          <ul className="overflow-y-auto">
            {filteredConvos.map((c) => {
              const unread = (c.unread_count ?? 0) > 0
              return (
                <li key={c.id}>
                  <button
                    onClick={() => { setActiveId(c.id); setMobileShowChat(true) }}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                      activeId === c.id
                        ? 'bg-bordeaux/10 dark:bg-or/10'
                        : 'hover:bg-sable/30 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="relative">
                      <Avatar
                        url={c.other_user?.avatar_url}
                        firstName={c.other_user?.first_name}
                        lastName={c.other_user?.last_name}
                        size={36}
                      />
                      {unread && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-or ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`truncate text-xs ${unread ? 'font-bold text-bordeaux dark:text-slate-100' : 'font-medium text-bordeaux dark:text-slate-200'}`}>
                          {c.other_user?.first_name} {c.other_user?.last_name}
                        </p>
                        {c.last_message && (
                          <span className="ml-2 shrink-0 text-[10px] text-pierre dark:text-slate-500">
                            {formatLastMsgTime(c.last_message.sent_at)}
                          </span>
                        )}
                      </div>
                      {c.last_message ? (
                        <p className={`truncate text-[11px] ${unread ? 'font-medium text-bordeaux dark:text-slate-300' : 'text-pierre dark:text-slate-500'}`}>
                          {c.last_message.sender_id === currentUserId ? 'Vous : ' : ''}
                          {c.last_message.content}
                        </p>
                      ) : (
                        <p className="text-[11px] italic text-pierre/60 dark:text-slate-600">Aucun message</p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ─── ZONE DE CHAT ─── */}
      <div className={`flex flex-1 flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-or/10 text-or/40">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-sm font-medium text-bordeaux dark:text-slate-200">Ta messagerie</p>
            <p className="mt-1 text-xs text-pierre dark:text-slate-500">
              Sélectionne une conversation ou démarre-en une nouvelle.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-pierre/15 px-4 py-3 dark:border-white/10">
              <button
                onClick={() => setMobileShowChat(false)}
                className="md:hidden text-bordeaux hover:text-bordeaux/80 dark:text-or"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
              </button>
              <Avatar
                url={activeConvo?.other_user?.avatar_url}
                firstName={activeConvo?.other_user?.first_name}
                lastName={activeConvo?.other_user?.last_name}
                size={32}
              />
              <div>
                <p className="text-sm font-semibold text-bordeaux dark:text-slate-100">
                  {activeConvo?.other_user?.first_name} {activeConvo?.other_user?.last_name}
                </p>
                <p className="text-[10px] text-olive">En ligne</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainer} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-or/10 text-or/40">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  </div>
                  <p className="text-xs text-pierre dark:text-slate-500">Commence la conversation !</p>
                </div>
              )}
              {messages.map((m, idx) => {
                const isMine = m.sender_id === currentUserId
                const prevMsg = idx > 0 ? messages[idx - 1] : null
                const sameSender = prevMsg?.sender_id === m.sender_id
                const prevDate = prevMsg ? new Date(prevMsg.sent_at).toDateString() : null
                const curDate = new Date(m.sent_at).toDateString()
                const showDate = prevDate !== curDate
                const showTime = !sameSender || showDate

                return (
                  <div key={m.id}>
                    {/* Date divider */}
                    {showDate && (
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 border-t border-pierre/10 dark:border-white/5" />
                        <span className="shrink-0 text-[10px] font-medium text-pierre/60 dark:text-slate-500">
                          {formatDate(m.sent_at)}
                        </span>
                        <div className="flex-1 border-t border-pierre/10 dark:border-white/5" />
                      </div>
                    )}

                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showTime ? 'mt-3' : 'mt-0.5'}`}>
                      <div className={`max-w-[75%] ${showTime ? '' : isMine ? 'mr-0' : 'ml-0'}`}>
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                            isMine
                              ? 'bg-bordeaux text-parchemin rounded-br-md'
                              : 'bg-sable/50 text-bordeaux rounded-bl-md dark:bg-white/10 dark:text-slate-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                        {showTime && (
                          <p className={`mt-0.5 flex items-center gap-1 text-[10px] text-pierre/50 dark:text-slate-600 ${isMine ? 'justify-end' : ''}`}>
                            {formatTime(m.sent_at)}
                            {isMine && (
                              <span className={m.read_at ? 'text-olive' : ''}>
                                {m.read_at ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                                )}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-sable/50 px-4 py-2.5 dark:bg-white/10">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pierre/40 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pierre/40 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pierre/40 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-pierre/15 px-4 py-3 dark:border-white/10">
              <input
                ref={inputRef}
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Écrire un message…"
                className="flex-1 rounded-full bg-sable/30 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-pierre/40 focus:bg-sable/50 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !newMsg.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-bordeaux text-white transition-all hover:bg-bordeaux/80 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-or dark:text-slate-900"
              >
                {sending ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

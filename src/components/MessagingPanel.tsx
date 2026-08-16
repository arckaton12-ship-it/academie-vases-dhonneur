import { FormEvent, useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/Avatar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MessageBubble } from '@/components/MessageBubble'
import { sendPushNotification } from '@/lib/pushSend'
import { toast, toastError } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  createConversation,
  subscribeToMessages,
  getAvailableContacts,
  updateMyStatus,
  getUserOnlineStatus,
  getOrCreateServiceGroupConversation,
  Conversation,
  Message,
  Contact,
} from '@/lib/messaging'

interface MessagingPanelProps {
  currentUserId: string
  userRole: 'ADMINISTRATEUR' | 'MODERATEUR' | 'ETUDIANT'
}

function MessagingPanelInner({ currentUserId, userRole }: MessagingPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const messagesContainer = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAtBottomRef = useRef(true)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [showNewConvo, setShowNewConvo] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchContact, setSearchContact] = useState('')
  const [searchConvos, setSearchConvos] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null)
  const [otherOnline, setOtherOnline] = useState<boolean | null>(null)
  const [studentProfile, setStudentProfile] = useState<{ class_id: string | null; department: string | null } | null>(null)
  const [serviceGroupLoading, setServiceGroupLoading] = useState(false)

  // Load student profile for service group
  useEffect(() => {
    if (userRole !== 'ETUDIANT') return
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('profiles').select('class_id, department').eq('id', data.user.id).single().then(({ data: profile }) => {
        if (profile) setStudentProfile({ class_id: profile.class_id, department: profile.department })
      })
    }).catch(() => {})
  }, [userRole])

  async function openServiceGroup() {
    if (!studentProfile?.class_id || !studentProfile?.department) {
      toastError('Ta tribu ou département n\'est pas renseigné. Va dans les paramètres.')
      return
    }
    setServiceGroupLoading(true)
    try {
      const convo = await getOrCreateServiceGroupConversation(studentProfile.class_id, studentProfile.department)
      // Check if already in list
      const existing = conversations.find((c) => c.id === convo.id)
      if (!existing) {
        const dept = studentProfile.department || 'Service'
        const enriched: Conversation = {
          ...convo,
          other_user: { id: 'service-group', first_name: dept, last_name: '(Service)', avatar_url: null },
          last_message: null,
          unread_count: 0,
        }
        setConversations((prev) => [enriched, ...prev])
      }
      setActiveId(convo.id)
      setMobileShowChat(true)
    } catch (e: any) {
      console.error('[Messaging] openServiceGroup:', e)
      toastError(e?.message || 'Impossible d\'ouvrir le groupe de service.')
    } finally {
      setServiceGroupLoading(false)
    }
  }

  // Load conversations
  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch((e) => {
        console.error('[Messaging] getConversations:', e)
        setLoadError('Impossible de charger les conversations.')
      })
      .finally(() => setLoading(false))
  }, [])

  // Mark as read when opening conversation
  useEffect(() => {
    if (!activeId) return
    markAsRead(activeId).then(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, unread_count: 0 } : c))
      )
    }).catch(() => {})
  }, [activeId])

  // Reset message input when switching conversations
  useEffect(() => {
    setNewMsg('')
    setReplyTo(null)
  }, [activeId])

  // Check online status of other user
  useEffect(() => {
    if (!activeId) { setOtherOnline(null); return }
    const convo = conversations.find((c) => c.id === activeId)
    const otherId = convo?.other_user?.id
    if (!otherId) { setOtherOnline(null); return }
    let cancelled = false
    getUserOnlineStatus(otherId).then((status) => {
      if (!cancelled) setOtherOnline(status?.is_online ?? null)
    }).catch(() => { if (!cancelled) setOtherOnline(null) })
    return () => { cancelled = true }
  }, [activeId, conversations])

  // Update own status every 30s
  useEffect(() => {
    updateMyStatus().catch(() => {})
    const interval = setInterval(() => { updateMyStatus().catch(() => {}) }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load messages + subscribe to realtime
  useEffect(() => {
    if (!activeId) { setMessages([]); return }
    let cancelled = false

    getMessages(activeId)
      .then((msgs) => { if (!cancelled) setMessages(msgs) })
      .catch((e) => {
        console.error('[Messaging] getMessages:', e)
        toastError('Erreur lors du chargement des messages.')
      })

    const unsub = subscribeToMessages(activeId, (msg) => {
      if (cancelled) return
      // Dedup: skip if message already exists (from optimistic insert or duplicate realtime)
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id || (msg.client_id && m.client_id === msg.client_id))) {
          // If we have an optimistic version with status 'sending', replace it
          if (msg.client_id) {
            const idx = prev.findIndex((m) => m.client_id === msg.client_id)
            if (idx !== -1) {
              const updated = [...prev]
              updated[idx] = { ...msg, status: 'delivered' }
              return updated
            }
          }
          return prev
        }
        return [...prev, { ...msg, status: 'delivered' }]
      })

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, last_message: { content: msg.content, sent_at: msg.sent_at, sender_id: msg.sender_id } }
            : c
        )
      )
    })

    return () => { cancelled = true; unsub() }
  }, [activeId])

  // Auto-scroll only when user is at bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Focus input when conversation changes
  useEffect(() => {
    if (activeId) inputRef.current?.focus()
  }, [activeId])

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = messagesContainer.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  }, [])

  function openNewConvo() {
    setShowNewConvo(true)
    if (contacts.length === 0) {
      getAvailableContacts().then(setContacts).catch((e) => {
        console.error('[Messaging] getAvailableContacts:', e)
        toastError('Impossible de charger les contacts.')
      })
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
        const convo = await createConversation(contact.id)
        const enriched: Conversation = { ...convo, other_user: contact, last_message: null, unread_count: 0 }
        setConversations((prev) => [enriched, ...prev])
        setActiveId(convo.id)
      }
    } catch (e: any) {
      console.error('[Messaging] startConvo:', e)
      toastError(e?.message || 'Impossible de creer la conversation.')
    }
    setShowNewConvo(false)
    setMobileShowChat(true)
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const text = replyTo
      ? `> ${replyTo.content.split('\n')[0]}\n${newMsg.trim()}`
      : newMsg.trim()
    if (!text || !activeId || sending) return

    setSending(true)

    // Optimistic: add message immediately with status 'sending'
    const clientId = `cid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const optimisticMsg: Message = {
      id: clientId,
      conversation_id: activeId,
      sender_id: currentUserId,
      content: text,
      sent_at: new Date().toISOString(),
      read_at: null,
      client_id: clientId,
      status: 'sending',
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setNewMsg('')
    setReplyTo(null)

    // Scroll to bottom on send
    setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      const realMsg = await sendMessage(activeId, text, replyTo?.id, clientId)
      // Push notification to recipient
      const convo = conversations.find((c) => c.id === activeId)
      const recipientId = convo?.other_user?.id
      if (recipientId && recipientId !== currentUserId) {
        sendPushNotification({
          userId: recipientId,
          title: 'Nouveau message',
          body: text.length > 80 ? text.substring(0, 80) + '...' : text,
          tag: 'new-message',
        }).catch(() => {})
      }
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => m.client_id === clientId ? { ...realMsg, status: 'sent' } : m)
      )
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, last_message: { content: realMsg.content, sent_at: realMsg.sent_at, sender_id: realMsg.sender_id } }
            : c
        )
      )
    } catch (e: any) {
      console.error('[Messaging] sendMessage:', e)
      // Mark as failed
      setMessages((prev) =>
        prev.map((m) => m.client_id === clientId ? { ...m, status: 'failed' } : m)
      )
      toastError(e?.message || 'Echec de l\'envoi.')
    } finally {
      setSending(false)
    }
  }

  function handleContextMenu(msg: Message, e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ msg, x: e.clientX, y: e.clientY })
  }

  function handleLongPress(msg: Message) {
    // On mobile, show a simple action sheet
    if ('ontouchstart' in window) {
      const action = window.confirm(`Message de ${msg.sender_id === currentUserId ? 'vous' : 'l\'interlocuteur'}:\n\n"${msg.content.slice(0, 50)}${msg.content.length > 50 ? '...' : ''}"\n\nRepondre ?`)
      if (action) {
        setReplyTo(msg)
        inputRef.current?.focus()
      }
    } else {
      setContextMenu({ msg, x: window.innerWidth / 2, y: window.innerHeight / 2 })
    }
  }

  function handleReply(msg: Message) {
    setReplyTo(msg)
    setContextMenu(null)
    inputRef.current?.focus()
  }

  function handleCopy(msg: Message) {
    navigator.clipboard?.writeText(msg.content).then(() => toast('Copie !'))
    setContextMenu(null)
  }

  function handleRetry(msg: Message) {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id))
    setNewMsg(msg.content.replace(/^> .+\n/, ''))
    setContextMenu(null)
    inputRef.current?.focus()
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'A l\'instant'
    if (diffMins < 60) return `${diffMins}min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h`
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
          Chargement...
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-card border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20">
        <div className="text-center">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{loadError}</p>
          <button onClick={() => { setLoadError(null); setLoading(true); getConversations().then(setConversations).catch(() => setLoadError('Erreur persistante.')).finally(() => setLoading(false)) }} className="mt-3 text-xs font-medium text-bordeaux hover:underline dark:text-or">
            Reessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-[600px] overflow-hidden rounded-card border border-pierre/15 bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-white/5">
      {/* NEW CONVERSATION OVERLAY */}
      {showNewConvo && (
        <div className="absolute inset-0 z-20 flex flex-col rounded-card bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-pierre/15 px-4 py-3 dark:border-white/10">
            <button onClick={() => setShowNewConvo(false)} className="text-pierre hover:text-bordeaux dark:text-slate-400 dark:hover:text-or">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <p className="text-sm font-semibold text-bordeaux dark:text-slate-100">Nouvelle conversation</p>
          </div>
          <div className="px-4 py-2">
            <Input value={searchContact} onChange={(e) => setSearchContact(e.target.value)} placeholder="Rechercher une personne..." className="!bg-sable/30 dark:!bg-white/5" />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {contacts
              .filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchContact.toLowerCase()))
              .map((c) => (
                <li key={c.id}>
                  <button onClick={() => startConvo(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sable/30 dark:hover:bg-white/5">
                    <Avatar url={c.avatar_url} firstName={c.first_name} lastName={c.last_name} size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-bordeaux dark:text-slate-100">{c.first_name} {c.last_name}</p>
                      <p className="text-[11px] capitalize text-pierre dark:text-slate-500">{c.role === 'ETUDIANT' ? 'Etudiant' : c.role === 'MODERATEUR' ? 'Moderateur' : 'Admin'}</p>
                    </div>
                  </button>
                </li>
              ))}
            {contacts.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-pierre dark:text-slate-500">Chargement des contacts...</p>
              </div>
            )}
          </ul>
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`w-72 flex-shrink-0 border-r border-pierre/15 bg-white/40 dark:bg-slate-900/40 dark:border-white/5 ${mobileShowChat ? 'hidden md:block' : 'block'}`}>
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
            <button onClick={openNewConvo} className="flex h-7 w-7 items-center justify-center rounded-full bg-bordeaux text-white transition-colors hover:bg-bordeaux/80 dark:bg-or dark:text-slate-900" title="Nouvelle conversation">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          {conversations.length > 3 && (
            <div className="mt-2">
              <Input value={searchConvos} onChange={(e) => setSearchConvos(e.target.value)} placeholder="Rechercher..." className="!py-1.5 !text-xs !bg-sable/30 dark:!bg-white/5" />
            </div>
          )}
        </div>

        {userRole === 'ETUDIANT' && studentProfile?.department && (
          <div className="border-b border-pierre/15 px-3 py-2 dark:border-white/10">
            <button
              onClick={openServiceGroup}
              disabled={serviceGroupLoading}
              className="flex w-full items-center gap-2 rounded-lg bg-or/10 px-3 py-2 text-left text-xs font-medium text-or transition-colors hover:bg-or/20 dark:bg-or/10 dark:hover:bg-or/20 disabled:opacity-50"
            >
              {serviceGroupLoading ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              )}
              Parler à mon Groupe de Service
            </button>
          </div>
        )}

        {filteredConvos.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-xs text-pierre dark:text-slate-500">{conversations.length === 0 ? 'Aucune conversation.' : 'Aucun resultat.'}</p>
            {conversations.length === 0 && (
              <button onClick={openNewConvo} className="mt-2 text-xs font-medium text-bordeaux hover:underline dark:text-or">Demarrer une conversation</button>
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
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${activeId === c.id ? 'bg-bordeaux/10 dark:bg-or/10' : 'hover:bg-sable/30 dark:hover:bg-white/5'}`}
                  >
                    <div className="relative">
                      {c.type === 'SERVICE_GROUP' ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-or/15 text-or">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                      ) : (
                        <Avatar url={c.other_user?.avatar_url} firstName={c.other_user?.first_name} lastName={c.other_user?.last_name} size={36} />
                      )}
                      {unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-or ring-2 ring-white dark:ring-slate-900" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`truncate text-xs ${unread ? 'font-bold text-bordeaux dark:text-slate-100' : 'font-medium text-bordeaux dark:text-slate-200'}`}>
                          {c.type === 'SERVICE_GROUP' ? `${c.other_user?.first_name} — Groupe` : `${c.other_user?.first_name} ${c.other_user?.last_name}`}
                        </p>
                        {c.last_message && (
                          <span className="ml-2 shrink-0 text-[10px] text-pierre dark:text-slate-500">{formatLastMsgTime(c.last_message.sent_at)}</span>
                        )}
                      </div>
                      {c.last_message ? (
                        <p className={`truncate text-[11px] ${unread ? 'font-bold text-bordeaux dark:text-slate-200' : 'text-pierre dark:text-slate-500'}`}>
                          {c.last_message.sender_id === currentUserId ? 'Vous : ' : ''}{c.last_message.content}
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

      {/* CHAT ZONE */}
      <div className={`flex flex-1 flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-or/10 text-or/40">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-sm font-medium text-bordeaux dark:text-slate-200">Ta messagerie</p>
            <p className="mt-1 text-xs text-pierre dark:text-slate-500">Selectionne une conversation ou demarre-en une nouvelle.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-pierre/15 px-4 py-3 dark:border-white/10">
              <button onClick={() => setMobileShowChat(false)} className="md:hidden text-bordeaux hover:text-bordeaux/80 dark:text-or">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
              </button>
              {activeConvo?.type === 'SERVICE_GROUP' ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-or/15 text-or">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              ) : (
                <Avatar url={activeConvo?.other_user?.avatar_url} firstName={activeConvo?.other_user?.first_name} lastName={activeConvo?.other_user?.last_name} size={32} />
              )}
              <div>
                <p className="text-sm font-semibold text-bordeaux dark:text-slate-100">
                  {activeConvo?.type === 'SERVICE_GROUP'
                    ? `${activeConvo?.other_user?.first_name} — Groupe`
                    : `${activeConvo?.other_user?.first_name} ${activeConvo?.other_user?.last_name}`}
                </p>
                {activeConvo?.type !== 'SERVICE_GROUP' && (
                  <p className="text-[10px] text-olive">{otherOnline === true ? 'En ligne' : otherOnline === false ? 'Hors ligne' : ''}</p>
                )}
                {activeConvo?.type === 'SERVICE_GROUP' && (
                  <p className="text-[10px] text-olive">Discussion de groupe</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainer} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1" aria-live="polite" aria-label="Messages de la conversation">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
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
                const showSenderName = !isMine && (!prevMsg || prevMsg.sender_id !== m.sender_id)

                return (
                  <div key={m.id}>
                    {showDate && (
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 border-t border-pierre/10 dark:border-white/5" />
                        <span className="shrink-0 text-[10px] font-medium text-pierre/60 dark:text-slate-500">{formatDate(m.sent_at)}</span>
                        <div className="flex-1 border-t border-pierre/10 dark:border-white/5" />
                      </div>
                    )}
                    <div className={`${showTime ? 'mt-3' : 'mt-0.5'}`}>
                      <MessageBubble
                        message={m}
                        isMine={isMine}
                        showSenderName={showSenderName}
                        senderName={activeConvo?.other_user?.first_name}
                        onReply={handleReply}
                        onLongPress={handleLongPress}
                      />
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEnd} />
            </div>

            {/* Context menu */}
            {contextMenu && (
              <div
                className="fixed z-[9999] rounded-xl border border-pierre/15 bg-white py-1 shadow-xl dark:bg-slate-800 dark:border-white/10"
                style={{ left: Math.min(contextMenu.x, window.innerWidth - 180), top: Math.min(contextMenu.y, window.innerHeight - 150) }}
              >
                <button onClick={() => handleReply(contextMenu.msg)} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-bordeaux hover:bg-sable/30 dark:text-slate-200 dark:hover:bg-white/5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                  Repondre
                </button>
                <button onClick={() => handleCopy(contextMenu.msg)} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-bordeaux hover:bg-sable/30 dark:text-slate-200 dark:hover:bg-white/5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copier
                </button>
                {contextMenu.msg.status === 'failed' && (
                  <button onClick={() => handleRetry(contextMenu.msg)} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Reessayer
                  </button>
                )}
              </div>
            )}

            {/* Reply preview */}
            {replyTo && (
              <div className="flex items-center gap-2 border-t border-pierre/10 bg-sable/20 px-4 py-2 dark:bg-white/5 dark:border-white/5">
                <div className="min-w-0 flex-1 border-l-2 border-or pl-2">
                  <p className="text-[10px] font-medium text-or">Reponse a {replyTo.sender_id === currentUserId ? 'vous-meme' : activeConvo?.other_user?.first_name}</p>
                  <p className="truncate text-[11px] text-pierre dark:text-slate-400">{replyTo.content.split('\n')[0].replace('> ', '')}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-pierre hover:text-bordeaux dark:text-slate-400 dark:hover:text-or">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-pierre/15 px-4 py-3 dark:border-white/10">
              <input
                ref={inputRef}
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder={replyTo ? 'Ecrire une reponse...' : 'Ecrire un message...'}
                className="flex-1 rounded-full bg-sable/30 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-pierre/40 focus:bg-sable/50 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-600"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
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

export function MessagingPanel(props: MessagingPanelProps) {
  return (
    <ErrorBoundary sectionName="Messagerie" fallback={
      <div className="flex h-[600px] items-center justify-center rounded-card border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20">
        <p className="text-sm text-red-600 dark:text-red-400">La messagerie a encounters une erreur.</p>
      </div>
    }>
      <MessagingPanelInner {...props} />
    </ErrorBoundary>
  )
}

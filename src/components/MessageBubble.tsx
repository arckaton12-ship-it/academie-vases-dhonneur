import { useRef, useState, TouchEvent } from 'react'
import { Message } from '@/lib/messaging'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  showSenderName?: boolean
  senderName?: string
  onReply: (msg: Message) => void
  onLongPress?: (msg: Message) => void
}

function StatusIcon({ status }: { status?: string }) {
  if (status === 'sending') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-white/50">
        <circle cx="12" cy="12" r="10" strokeDasharray="30 60" />
      </svg>
    )
  }
  if (status === 'failed') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-300">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    )
  }
  if (status === 'read') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-300">
        <path d="M18 7l-8 8"/><path d="M20 7l-8 8"/><path d="M14 7l-8 8"/>
      </svg>
    )
  }
  if (status === 'delivered') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/60">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    )
  }
  // sent (single check)
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/50">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export function MessageBubble({ message: m, isMine, showSenderName, senderName, onReply, onLongPress }: MessageBubbleProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const [swipeX, setSwipeX] = useState(0)
  const [showReplyHint, setShowReplyHint] = useState(false)

  const isReply = m.content?.startsWith('> ')

  function handleTouchStart(e: TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    longPressTimer.current = setTimeout(() => {
      onLongPress?.(m)
    }, 500)
  }

  function handleTouchMove(e: TouchEvent) {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y)

    if (dy > 10) {
      cancelLongPress()
      return
    }

    if (Math.abs(dx) > 15) {
      cancelLongPress()
      if (dx < 0) {
        setSwipeX(Math.max(dx, -80))
        setShowReplyHint(dx < -30)
      }
    }
  }

  function handleTouchEnd() {
    cancelLongPress()
    if (swipeX < -40) {
      onReply(m)
    }
    setSwipeX(0)
    setShowReplyHint(false)
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  return (
    <div
      className={`msg-enter flex ${isMine ? 'justify-end' : 'justify-start'}`}
      style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s ease' : 'none' }}
      onContextMenu={(e) => { e.preventDefault(); onLongPress?.(m) }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showReplyHint && (
        <div className="flex items-center pr-2 text-or/60">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
          </svg>
        </div>
      )}
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
        {showSenderName && !isMine && (
          <p className="mb-0.5 ml-1 text-[10px] font-semibold text-or">{senderName}</p>
        )}

        {isReply && (
          <div className={`mb-0.5 rounded-t-lg border-l-2 px-2.5 py-1 text-[10px] italic ${
            isMine ? 'border-white/30 text-white/70 bg-bordeaux/60' : 'border-or/30 text-pierre/60 dark:text-slate-500 bg-sable/30 dark:bg-white/5'
          }`}>
            {m.content.split('\n')[0].replace('> ', '')}
          </div>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isMine
              ? 'bg-bordeaux text-parchemin rounded-br-md'
              : 'bg-sable/50 text-bordeaux rounded-bl-md dark:bg-white/10 dark:text-slate-200'
          } ${isReply ? 'rounded-tl-md' : ''}`}
        >
          <p className="whitespace-pre-wrap">{isReply ? m.content.split('\n').slice(1).join('\n') : m.content}</p>
        </div>

        <div className={`mt-0.5 flex items-center gap-1 text-[10px] text-pierre/50 dark:text-slate-600 ${isMine ? 'justify-end' : ''}`}>
          <span>{new Date(m.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          {isMine && <StatusIcon status={m.status} />}
        </div>
      </div>
    </div>
  )
}

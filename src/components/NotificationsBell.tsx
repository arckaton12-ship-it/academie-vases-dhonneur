import { useState, useEffect, useRef } from 'react'
import { vibrateAndPlay } from '@/lib/sound'

export interface NotificationRow {
  id: string
  type: string | null
  title: string | null
  body: string | null
  link: string | null
  read: boolean
  created_at: string | null
}

const TYPE_ICONS: Record<string, string> = {
  message: '💬',
  annonce: '📢',
  correction: '✅',
  devoir: '📝',
  badge: '🏅',
  cours: '📚',
  systeme: '⚙️',
}

const TYPE_COLORS: Record<string, string> = {
  message: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  annonce: 'bg-or/10 text-or',
  correction: 'bg-olive/10 text-olive',
  devoir: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  badge: 'bg-or/10 text-or',
  cours: 'bg-bordeaux/10 text-bordeaux',
  systeme: 'bg-pierre/10 text-pierre',
}

interface NotificationsBellProps {
  notifications: NotificationRow[]
  onMarkRead: () => void
  onNavigate?: (type: string | null) => void
}

export function NotificationsBell({ notifications, onMarkRead, onNavigate }: NotificationsBellProps) {
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length
  const prevUnread = useRef(unread)

  useEffect(() => {
    if (unread > prevUnread.current) {
      vibrateAndPlay()
    }
    prevUnread.current = unread
  }, [unread])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) onMarkRead()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread > 0 ? `, ${unread} non lues` : ''}`}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-pierre/20 text-pierre transition-colors hover:border-bordeaux hover:text-bordeaux"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 10a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M10 19a2.2 2.2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bordeaux px-1 font-mono text-[10px] font-semibold text-parchemin">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer les notifications"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[85vw] rounded-xl border border-pierre/15 bg-white shadow-xl dark:bg-slate-900 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-pierre/10 px-4 py-2.5 dark:border-white/10">
              <p className="font-display text-sm font-semibold text-bordeaux dark:text-slate-100">Notifications</p>
              {unread > 0 && (
                <span className="rounded-full bg-or/10 px-2 py-0.5 text-[10px] font-bold text-or">{unread} non lu{unread > 1 ? 'es' : ''}</span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-pierre dark:text-slate-500">Aucune notification.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { onNavigate?.(n.type); setOpen(false) }}
                    className={`flex items-start gap-3 border-b border-pierre/5 px-4 py-3 last:border-b-0 transition-colors hover:bg-sable/20 dark:hover:bg-white/5 cursor-pointer ${
                      !n.read ? 'bg-or/5' : ''
                    }`}
                  >
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm ${TYPE_COLORS[n.type ?? 'systeme'] ?? TYPE_COLORS.systeme}`}>
                      {TYPE_ICONS[n.type ?? 'systeme'] ?? '🔔'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-bordeaux dark:text-slate-100' : 'text-bordeaux/80 dark:text-slate-300'}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="mt-0.5 text-xs text-pierre dark:text-slate-500 line-clamp-2">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-pierre/50 dark:text-slate-600">
                        {n.created_at ? formatNotifTime(n.created_at) : ''}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-or" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function formatNotifTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "A l'instant"
  if (diffMins < 60) return `Il y a ${diffMins}min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

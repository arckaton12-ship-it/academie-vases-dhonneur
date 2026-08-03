import { useState } from 'react'

export interface NotificationRow {
  id: string
  type: string | null
  title: string | null
  body: string | null
  read: boolean
  created_at: string | null
}

interface NotificationsBellProps {
  notifications: NotificationRow[]
  onMarkRead: () => void
}

export function NotificationsBell({ notifications, onMarkRead }: NotificationsBellProps) {
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length

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
          <path
            d="M6 10a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 19a2.2 2.2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bordeaux px-1 font-mono text-[10px] font-semibold text-parchemin">
            {unread}
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
          <div className="absolute right-0 z-20 mt-2 w-72 max-w-[85vw] rounded-card border border-sable/60 bg-parchemin shadow-lg">
            <p className="border-b border-sable/60 px-3 py-2 font-display text-sm text-bordeaux">
              Notifications
            </p>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-4 text-sm text-pierre">
                  Aucune notification pour le moment.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`border-b border-sable/40 px-3 py-2.5 last:border-b-0 ${
                      n.read ? 'opacity-70' : 'bg-or/5'
                    }`}
                  >
                    <p className="text-sm font-medium text-bordeaux">{n.title ?? 'Notification'}</p>
                    {n.body && <p className="mt-0.5 text-xs text-pierre">{n.body}</p>}
                    {n.created_at && (
                      <p className="mt-1 font-mono text-[10px] text-pierre/70">
                        {new Date(n.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
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

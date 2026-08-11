import { InAppNotification } from '@/hooks/useInAppNotifications'

interface NotificationBannerProps {
  notification: InAppNotification
  onDismiss: () => void
}

const TYPE_ICONS: Record<InAppNotification['type'], string> = {
  message: '💬',
  course: '📚',
  badge: '🏅',
  assignment: '📝',
  announcement: '📢',
  streak: '🔥',
}

const TYPE_COLORS: Record<InAppNotification['type'], string> = {
  message: 'border-l-teal bg-teal/5',
  course: 'border-l-or bg-or/5',
  badge: 'border-l-or bg-or/5',
  assignment: 'border-l-olive bg-olive/5',
  announcement: 'border-l-bordeaux bg-bordeaux/5',
  streak: 'border-l-or bg-or/5',
}

export function NotificationBanner({ notification: n, onDismiss }: NotificationBannerProps) {
  return (
    <div
      className={`notif-banner-in fixed top-0 left-0 right-0 z-[100] border-l-4 ${TYPE_COLORS[n.type]} bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:bg-slate-900/95`}
      onClick={onDismiss}
      role="alert"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <span className="text-xl">{TYPE_ICONS[n.type]}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-bordeaux dark:text-slate-100">{n.title}</p>
          <p className="truncate text-xs text-pierre dark:text-slate-400">{n.body}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss() }}
          className="shrink-0 rounded-full p-1 text-pierre/40 hover:text-pierre dark:text-slate-500 dark:hover:text-slate-300"
          aria-label="Fermer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

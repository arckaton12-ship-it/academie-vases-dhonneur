interface ProgressTrackerProps {
  completed: number
  total: number
  level: number
  streak?: number
  className?: string
}

export function ProgressTracker({ completed, total, level, streak = 0, className = '' }: ProgressTrackerProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <div className="relative flex-shrink-0">
        <svg width="88" height="88" viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="5" className="text-pierre/10 dark:text-white/5" />
          <circle
            cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="5"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-or transition-all duration-700 ease-out dark:text-or"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-bordeaux dark:text-slate-100">{pct}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-or/10 px-2.5 py-0.5 text-xs font-semibold text-or">
            Niveau {level}
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-bordeaux/10 px-2.5 py-0.5 text-xs font-semibold text-bordeaux dark:text-or">
              🔥 {streak} sem.
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm font-medium text-bordeaux dark:text-slate-200">
          {completed} / {total} cours suivis
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-pierre/10 dark:bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-or to-olive transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-pierre dark:text-slate-500">
          {total - completed} cours restant{total - completed > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

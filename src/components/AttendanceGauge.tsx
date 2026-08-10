interface AttendanceGaugeProps {
  weeks: number
  maxWeeks?: number
  presenceRate?: number
  className?: string
}

export function AttendanceGauge({ weeks, maxWeeks = 8, presenceRate, className = '' }: AttendanceGaugeProps) {
  const segments = Math.min(weeks, maxWeeks)
  const pct = presenceRate ?? Math.min(Math.round((weeks / maxWeeks) * 100), 100)

  return (
    <div className={`rounded-lg border border-or/30 bg-gradient-to-r from-or/5 to-transparent p-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Hero circle: bigger on mobile */}
        <div className="relative h-14 w-14 flex-shrink-0 sm:h-12 sm:w-12">
          <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90 sm:hidden">
            <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-pierre/10 dark:text-white/5" />
            <circle
              cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
              strokeDasharray={2 * Math.PI * 24}
              strokeDashoffset={2 * Math.PI * 24 - (pct / 100) * 2 * Math.PI * 24}
              strokeLinecap="round"
              className="text-or transition-all duration-500"
            />
          </svg>
          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90 hidden sm:block">
            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-pierre/10 dark:text-white/5" />
            <circle
              cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3.5"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 - (pct / 100) * 2 * Math.PI * 20}
              strokeLinecap="round"
              className="text-or transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-or sm:text-sm">
            {pct}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-bordeaux dark:text-slate-200 sm:text-[11px] sm:font-semibold">
            {weeks > 0 ? `${weeks} sem. assiduité` : 'Assiduité'}
          </p>
          <div className="mt-1.5 flex gap-0.5 sm:mt-1">
            {Array.from({ length: maxWeeks }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 sm:h-1 ${
                  i < segments ? 'bg-or' : 'bg-pierre/10 dark:bg-white/5'
                }`}
                style={i < segments ? { animationDelay: `${i * 50}ms` } : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

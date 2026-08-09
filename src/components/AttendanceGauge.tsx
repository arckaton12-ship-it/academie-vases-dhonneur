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
    <div className={`flex items-center gap-3 rounded-lg border border-or/30 bg-gradient-to-r from-or/5 to-transparent px-3 py-2 ${className}`}>
      <div className="relative h-10 w-10 flex-shrink-0">
        <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
          <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="3" className="text-pierre/10 dark:text-white/5" />
          <circle
            cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={2 * Math.PI * 17}
            strokeDashoffset={2 * Math.PI * 17 - (pct / 100) * 2 * Math.PI * 17}
            strokeLinecap="round"
            className="text-or transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-or">{pct}%</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-bordeaux dark:text-slate-200">
          {weeks > 0 ? `${weeks} sem. assiduité` : 'Assiduité'}
        </p>
        <div className="mt-1 flex gap-0.5">
          {Array.from({ length: maxWeeks }).map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i < segments ? 'bg-or' : 'bg-pierre/10 dark:bg-white/5'
              }`}
              style={i < segments ? { animationDelay: `${i * 50}ms` } : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

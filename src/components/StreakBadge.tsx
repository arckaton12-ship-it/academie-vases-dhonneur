interface StreakBadgeProps {
  weeks: number
}

/**
 * Représentation du streak : une ligne de segments qui s'illuminent
 * progressivement, comme une mèche qui se consume — pas une icône
 * d'emoji flamme générique. Chaque segment = une semaine suivie.
 * La transition illustre le "progrès" sans animation superflue.
 */
export function StreakBadge({ weeks }: StreakBadgeProps) {
  const segments = Math.min(weeks, 8)
  return (
    <div className="flex items-center gap-3 rounded-card border border-or/40 bg-white/60 px-4 py-3">
      <span className={`shrink-0 ${weeks > 0 ? 'flame-pulse' : ''}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2c0 4-4 5.5-4 9.5A4 4 0 0012 16a4 4 0 004-4.5C16 8 12 6 12 2z"
            stroke="#CFAF5B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 16v5" stroke="#CFAF5B" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <div className="flex-1">
        <p className="font-mono text-xs uppercase tracking-wide text-pierre">
          {weeks > 0
            ? `${weeks} semaine${weeks > 1 ? 's' : ''} d'assiduité`
            : "Ta première semaine commence maintenant"}
        </p>
        <div key={weeks} className="mt-1.5 flex gap-1" role="presentation">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < segments ? 'streak-segment bg-or' : 'bg-pierre/15'
              }`}
              style={i < segments ? { animationDelay: `${i * 70}ms` } : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

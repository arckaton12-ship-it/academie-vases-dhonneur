interface StreakFlameProps {
  weeks: number
  className?: string
}

function getFlameLevel(weeks: number): 0 | 1 | 2 | 3 {
  if (weeks === 0) return 0
  if (weeks <= 3) return 1
  if (weeks <= 7) return 2
  return 3
}

const FLAME_COLORS = [
  { outer: '#6B4226', mid: '#4A2C17', inner: '#3D2213', glow: '#00000000' },
  { outer: '#D4A017', mid: '#CFAF5B', inner: '#FFD700', glow: '#FFD70030' },
  { outer: '#D4760A', mid: '#E8A020', inner: '#FFD700', glow: '#FFA50040' },
  { outer: '#E85D04', mid: '#FF8C00', inner: '#FFD700', glow: '#FF660050' },
]

export function StreakFlame({ weeks, className = '' }: StreakFlameProps) {
  const level = getFlameLevel(weeks)
  const colors = FLAME_COLORS[level]

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <div className="relative h-12 w-10 sm:h-10 sm:w-8">
        {level > 0 ? (
          <svg viewBox="0 0 40 48" className={`streak-flame streak-flame--${level}`} width="100%" height="100%">
            <defs>
              <radialGradient id={`flame-glow-${level}`} cx="50%" cy="70%" r="50%">
                <stop offset="0%" stopColor={colors.glow} />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            {level >= 3 && (
              <circle cx="20" cy="38" r="16" fill={`url(#flame-glow-${level})`} className="animate-pulse" />
            )}
            <path
              d="M20 4 C22 14, 34 20, 34 32 C34 40, 28 46, 20 46 C12 46, 6 40, 6 32 C6 20, 18 14, 20 4Z"
              fill={colors.outer}
              className={level >= 2 ? 'streak-flame-outer' : ''}
            />
            <path
              d="M20 12 C21 18, 28 22, 28 32 C28 38, 24 42, 20 42 C16 42, 12 38, 12 32 C12 22, 19 18, 20 12Z"
              fill={colors.mid}
              className={level >= 2 ? 'streak-flame-mid' : ''}
            />
            <path
              d="M20 20 C21 24, 24 26, 24 32 C24 36, 22 38, 20 38 C18 38, 16 36, 16 32 C16 26, 19 24, 20 20Z"
              fill={colors.inner}
              className={level >= 2 ? 'streak-flame-inner' : ''}
            />
          </svg>
        ) : (
          <svg viewBox="0 0 40 48" width="100%" height="100%">
            <path
              d="M20 16 C22 22, 30 26, 30 34 C30 40, 26 44, 20 44 C14 44, 10 40, 10 34 C10 26, 18 22, 20 16Z"
              fill="#3D2213"
              opacity="0.3"
            />
            <circle cx="20" cy="38" r="3" fill="#6B4226" opacity="0.2" className="animate-pulse" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-or sm:text-base">
          {weeks > 0 ? `${weeks}` : '—'}
        </p>
        <p className="text-[10px] leading-tight text-pierre dark:text-slate-500 sm:text-[9px]">
          {weeks === 0
            ? 'Semaines'
            : weeks === 1
              ? 'Semaine'
              : 'Semaines'}
        </p>
      </div>
    </div>
  )
}

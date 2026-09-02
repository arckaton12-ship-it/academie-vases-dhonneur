interface XpBarProps {
  xp: number
  level: number
  levelLabel: string
  nextLevelLabel: string | null
  xpInLevel: number
  xpForNextLevel: number
  className?: string
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#8A9A5B',
  2: '#6B8E23',
  3: '#2E8B57',
  4: '#1B6B63',
  5: '#5D2A41',
  6: '#8B4513',
  7: '#B76E79',
  8: '#CFAF5B',
  9: '#DAA520',
  10: '#FFD700',
}

export function XpBar({ xp, level, levelLabel, nextLevelLabel, xpInLevel, xpForNextLevel, className = '' }: XpBarProps) {
  const pct = xpForNextLevel > 0 ? Math.min((xpInLevel / xpForNextLevel) * 100, 100) : 100
  const color = LEVEL_COLORS[level] || LEVEL_COLORS[1]
  const isMaxLevel = !nextLevelLabel

  return (
    <div className={`rounded-xl border border-or/20 bg-gradient-to-br from-or/5 to-or/10 p-4 dark:from-or/10 dark:to-or/5 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {level}
          </div>
          <div>
            <p className="text-sm font-bold text-bordeaux dark:text-or">{levelLabel}</p>
            <p className="text-[10px] text-pierre dark:text-slate-400">{xp.toLocaleString()} XP total</p>
          </div>
        </div>
        {!isMaxLevel && (
          <div className="text-right">
            <p className="text-[10px] text-pierre dark:text-slate-400">Prochain niveau</p>
            <p className="text-xs font-semibold text-bordeaux/70 dark:text-slate-300">{nextLevelLabel}</p>
          </div>
        )}
        {isMaxLevel && (
          <div className="rounded-full bg-or/20 px-2 py-0.5">
            <p className="text-[10px] font-bold text-or">NIVEAU MAX</p>
          </div>
        )}
      </div>

      {!isMaxLevel && (
        <div>
          <div className="h-2.5 overflow-hidden rounded-full bg-pierre/10 dark:bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}40`,
              }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-pierre dark:text-slate-500">
            {xpInLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </p>
        </div>
      )}
    </div>
  )
}

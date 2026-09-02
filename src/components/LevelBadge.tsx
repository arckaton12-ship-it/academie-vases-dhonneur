import { BADGES, isBadgeKey, type BadgeKey } from '@/lib/badges'

const LEVEL_BADGE_GRADIENTS: Record<number, string> = {
  1: 'from-[#8A9A5B] to-[#6B8E23]',
  2: 'from-[#6B8E23] to-[#2E8B57]',
  3: 'from-[#2E8B57] to-[#1B6B63]',
  4: 'from-[#1B6B63] to-[#5D2A41]',
  5: 'from-[#5D2A41] to-[#B76E79]',
  6: 'from-[#8B4513] to-[#CFAF5B]',
  7: 'from-[#B76E79] to-[#DAA520]',
  8: 'from-[#CFAF5B] to-[#FFD700]',
  9: 'from-[#DAA520] to-[#FFD700]',
  10: 'from-[#FFD700] to-[#FFA500]',
}

interface LevelBadgeProps {
  level: number
  levelLabel: string
  xp: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LevelBadge({ level, levelLabel, xp, size = 'md', className = '' }: LevelBadgeProps) {
  const gradient = LEVEL_BADGE_GRADIENTS[level] || LEVEL_BADGE_GRADIENTS[1]

  const sizeClasses = {
    sm: 'h-6 w-6 text-[9px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-sm',
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-bold text-white shadow-lg`}
        style={{ boxShadow: `0 2px 12px ${LEVEL_BADGE_GRADIENTS[level]?.split(' ')[0]?.replace('from-', '')}40` }}
      >
        {level}
      </div>
    </div>
  )
}

interface XpBadgeRowProps {
  earnedBadges: string[]
  xp: number
  level: number
  className?: string
}

export function XpBadgeRow({ earnedBadges, xp, level, className = '' }: XpBadgeRowProps) {
  const earnedSet = new Set(earnedBadges)
  const recentBadges = earnedBadges.slice(-5)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {recentBadges.map(key => {
        if (!isBadgeKey(key)) return null
        const meta = BADGES[key]
        const isXpBadge = meta.category === 'xp'
        return (
          <div
            key={key}
            className={`group relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm transition-transform hover:scale-110 ${
              isXpBadge ? 'bg-gradient-to-br from-or to-bordeaux' : 'bg-gradient-to-br from-olive to-bordeaux/70'
            }`}
            title={meta.label}
          >
            {level >= 10 ? '★' : level >= 5 ? '◆' : '●'}
            <div className="pointer-events-none absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-bordeaux px-2 py-0.5 text-[9px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {meta.label}
            </div>
          </div>
        )
      })}
      {earnedBadges.length > 5 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pierre/10 text-[10px] font-medium text-pierre dark:bg-white/10 dark:text-slate-400">
          +{earnedBadges.length - 5}
        </div>
      )}
    </div>
  )
}

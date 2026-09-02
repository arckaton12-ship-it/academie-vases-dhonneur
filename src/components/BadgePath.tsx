import { useMemo } from 'react'
import { BadgeCoin } from '@/components/Badge'
import { BADGE_ORDER, BADGES, isBadgeKey, type BadgeKey } from '@/lib/badges'
import type { BadgeProgress } from '@/lib/courses'

interface BadgePathProps {
  earnedBadgeTypes: string[]
  badgeProgress: BadgeProgress[]
  onSelectBadge?: (badgeType: string) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  attendance: 'Assiduité',
  completion: 'Accomplissement',
  xp: 'Expérience',
  achievement: 'Performance',
}

const CATEGORY_ORDER = ['attendance', 'completion', 'xp', 'achievement'] as const

export function BadgePath({ earnedBadgeTypes, badgeProgress, onSelectBadge }: BadgePathProps) {
  const earnedSet = useMemo(() => new Set(earnedBadgeTypes), [earnedBadgeTypes])

  const nextUnearnedKey = useMemo(() => BADGE_ORDER.find(k => !earnedSet.has(k)), [earnedSet])

  const groupedBadges = useMemo(() => {
    const groups: { category: string; label: string; keys: BadgeKey[] }[] = []
    for (const cat of CATEGORY_ORDER) {
      const keys = BADGE_ORDER.filter(k => isBadgeKey(k) && BADGES[k].category === cat)
      if (keys.length > 0) {
        groups.push({ category: cat, label: CATEGORY_LABELS[cat] ?? cat, keys })
      }
    }
    return groups
  }, [])

  return (
    <div className="relative">
      {nextUnearnedKey && (() => {
        const meta = isBadgeKey(nextUnearnedKey) ? BADGES[nextUnearnedKey] : null
        const progress = badgeProgress.find(p => p.badge_type === nextUnearnedKey)
        return (
          <div className="mb-5 rounded-xl border-2 border-or/40 bg-gradient-to-br from-or/5 to-or/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-or mb-1.5">Prochain badge</p>
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <BadgeCoin type={nextUnearnedKey} size={48} locked />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-bordeaux dark:text-slate-100">{meta?.label ?? nextUnearnedKey}</p>
                <p className="text-[11px] text-pierre dark:text-slate-400">{meta?.description}</p>
                {progress && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-pierre/10 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-or transition-all duration-500"
                        style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-or">
                      {progress.current}/{progress.target}
                    </span>
                  </div>
                )}
                {!progress && (
                  <p className="mt-1.5 text-[10px] text-pierre italic">Continue comme ça !</p>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {groupedBadges.map(({ category, label, keys }) => (
        <div key={category} className="mb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-pierre/50 dark:text-slate-500">
            {label}
          </p>
          {keys.map((key, idx) => {
            const earned = earnedSet.has(key)
            const progress = badgeProgress.find(p => p.badge_type === key)
            const meta = isBadgeKey(key) ? BADGES[key] : null
            const isLast = idx === keys.length - 1

            return (
              <div key={key} className="relative flex items-start gap-4">
                {!isLast && (
                  <div
                    className={`absolute left-[19px] top-[40px] w-0.5 ${
                      earned ? 'bg-or' : 'bg-pierre/15 dark:bg-white/10'
                    }`}
                    style={{ height: 'calc(100% - 40px)' }}
                  />
                )}

                <button
                  onClick={() => earned && onSelectBadge?.(key)}
                  disabled={!earned}
                  className={`relative z-10 flex-shrink-0 transition-transform ${
                    earned ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                  }`}
                  title={meta?.label}
                >
                  <div className={`relative rounded-full ${earned ? '' : 'opacity-40'}`}>
                    <BadgeCoin type={key} size={40} locked={!earned} />
                    {earned && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bordeaux text-parchemin shadow-sm">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </div>
                </button>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`text-xs font-semibold ${earned ? 'text-bordeaux dark:text-slate-100' : 'text-pierre/50 dark:text-slate-500'}`}>
                    {meta?.label ?? key}
                  </p>
                  {earned ? (
                    <p className="text-[10px] text-olive">{meta?.description}</p>
                  ) : progress ? (
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-pierre/10 dark:bg-white/5">
                          <div
                            className="h-full rounded-full bg-or transition-all duration-500"
                            style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-pierre dark:text-slate-500">
                          {progress.current}/{progress.target}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

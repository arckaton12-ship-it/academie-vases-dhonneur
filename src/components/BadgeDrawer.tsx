import { useEffect, useRef } from 'react'
import { Badge } from '@/components/Badge'
import { BADGES, BADGE_ORDER } from '@/lib/badges'
import type { BadgeProgress } from '@/lib/courses'

interface BadgeDrawerProps {
  open: boolean
  onClose: () => void
  earnedBadges: string[]
  activeBadge: string | null
  badgeProgress: BadgeProgress[]
  onSelect: (badgeType: string) => void
  busy?: boolean
}

export function BadgeDrawer({
  open,
  onClose,
  earnedBadges,
  activeBadge,
  badgeProgress,
  onSelect,
  busy,
}: BadgeDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const earnedSet = new Set(earnedBadges)
  const progressMap = new Map(badgeProgress.map((p) => [p.badge_type, p]))

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Salle des badges">
      <div className="absolute inset-0 bg-bordeaux/30 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        className="relative z-50 flex h-full w-full max-w-sm flex-col overflow-y-auto bg-parchemin shadow-2xl animate-slide-in-right"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sable/60 bg-parchemin/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="font-display text-lg text-bordeaux">Salle des badges</h2>
            <p className="text-xs text-pierre">
              {earnedBadges.length}/{BADGE_ORDER.length} obtenus
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-pierre hover:bg-or/10"
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-3 p-5">
          {BADGE_ORDER.map((key) => {
            const earned = earnedSet.has(key)
            const meta = BADGES[key]
            const progress = progressMap.get(key)
            const isActive = activeBadge === key

            return (
              <button
                key={key}
                onClick={() => earned && onSelect(key)}
                disabled={!earned || busy}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? 'border-or bg-or/10 shadow-sm'
                    : earned
                      ? 'border-pierre/15 bg-white hover:border-or/40 hover:shadow-sm'
                      : 'border-pierre/10 bg-pierre/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge type={key} size={48} locked={!earned} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-display text-sm ${earned ? 'text-bordeaux' : 'text-pierre'}`}>
                        {meta.label}
                      </p>
                      {isActive && (
                        <span className="rounded-full bg-or/20 px-2 py-0.5 text-[10px] font-medium text-or">
                          Actif
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-pierre">{meta.description}</p>
                    {progress && !earned && (
                      <div className="mt-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-pierre/15">
                          <div
                            className="h-full rounded-full bg-or transition-all"
                            style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[10px] text-pierre">
                          {progress.current}/{progress.target}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

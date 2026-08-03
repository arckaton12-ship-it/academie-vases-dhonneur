import { BadgeCoin } from '@/components/Badge'
import { BADGES, BADGE_ORDER } from '@/lib/badges'
import type { BadgeProgress } from '@/lib/courses'

interface BadgeHallProps {
  progress: BadgeProgress[]
  activeBadge: string | null
  busy?: boolean
  onClose: () => void
  onSelect: (badgeType: string) => void
}

function progressLabel(badgeType: string, p: BadgeProgress | undefined): string {
  if (!p) return 'En attente de progression'
  switch (badgeType) {
    case 'premiere-semaine':
      return p.current >= p.target ? 'Première présence validée' : 'Marque ta première présence'
    case 'premier-mois':
      return `${p.current}/${p.target} semaines de série`
    case 'assidu-huit':
      return `${p.current}/${p.target} semaines consécutives`
    case 'cinq-resumes':
      return `${p.current}/${p.target} résumés écrits`
    case 'dix-resumes':
      return `${p.current}/${p.target} résumés écrits`
    case 'cycle-1':
    case 'cycle-2':
    case 'cycle-3':
      return p.current >= p.target ? 'Cycle accompli' : `Cycle ${badgeType.split('-')[1]} à mener à son terme`
    default:
      return `${p.current}/${p.target}`
  }
}

export function BadgeHall({ progress, activeBadge, busy, onClose, onSelect }: BadgeHallProps) {
  const progressByType = new Map(progress.map((p) => [p.badge_type, p]))

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-bordeaux/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Salle des badges"
    >
      <div
        className="mx-auto my-8 w-[92%] max-w-2xl rounded-card border border-sable/60 bg-parchemin p-5 shadow-lg sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-bordeaux">Salle des badges</h2>
            <p className="mt-0.5 text-sm text-pierre">
              Tous les badges du système. Choisis celui que tu affiches sur ton avatar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la salle des badges"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-pierre/30 text-pierre transition-colors hover:border-bordeaux hover:text-bordeaux"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {BADGE_ORDER.map((key) => {
            const p = progressByType.get(key)
            const earned = p?.earned ?? false
            const meta = BADGES[key]
            const isActive = activeBadge === key
            const pct = p && p.target > 0 ? Math.min(100, Math.round((p.current / p.target) * 100)) : 0
            return (
              <div
                key={key}
                className={`rounded-card border p-3 ${
                  earned ? 'border-or/50 bg-white/60' : 'border-pierre/15 bg-white/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <BadgeCoin type={key} size={52} locked={!earned} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-display text-sm leading-tight ${earned ? 'text-bordeaux' : 'text-pierre'}`}>
                      {meta.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-tight text-pierre">{meta.description}</p>
                  </div>
                </div>

                <div className="mt-3">
                  {earned ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-pierre">
                        Obtenu le{' '}
                        <span className="font-mono text-bordeaux">
                          {p?.earned_at ? formatDate(p.earned_at) : '—'}
                        </span>
                      </p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onSelect(key)}
                        className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-bordeaux text-parchemin'
                            : 'border border-or/60 text-bordeaux hover:bg-or/10'
                        }`}
                      >
                        {isActive ? 'Badge actif' : 'Afficher sur mon avatar'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-pierre/15">
                        <div
                          className="h-full rounded-full bg-or transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-pierre">{progressLabel(key, p)}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-center text-xs text-pierre">
          La progression se met à jour en direct à chaque présence, résumé ou devoir rendu.
        </p>
      </div>
    </div>
  )
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

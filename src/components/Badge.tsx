import { BADGES, isBadgeKey } from '@/lib/badges'

interface BadgeProps {
  type: string
  size?: number
  locked?: boolean
}

/**
 * Médaille seule (pièce), sans cadre ni légende — réutilisée par le Badge
 * complet et par le médaillon doré du badge actif sur l'avatar.
 */
export function BadgeCoin({ type, size = 52, locked = false }: { type: string; size?: number; locked?: boolean }) {
  const meta = isBadgeKey(type) ? BADGES[type] : null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={meta ? meta.label : type}
      style={{
        filter: locked ? 'grayscale(1) opacity(0.45)' : undefined,
        transition: 'filter 0.4s ease',
      }}
    >
      <circle cx="24" cy="24" r="22" fill="#F8F4E9" stroke="#CFAF5B" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="17" fill="none" stroke="#CFAF5B" strokeWidth="1" opacity="0.5" />
      <BadgeMotif type={type} />
    </svg>
  )
}

/**
 * Médaille sur mesure pour chaque accomplissement.
 * Motif de base : la coupe (vase) de l'Académie, déclinée selon l'étape —
 * de la graine à la coupe ceinte, toujours dans la charte bordeaux/or.
 */
export function Badge({ type, size = 52, locked = false }: BadgeProps) {
  const meta = isBadgeKey(type) ? BADGES[type] : null

  return (
    <div
      className="flex w-full flex-col items-center gap-1.5 text-center"
      style={{ maxWidth: size + 24 }}
    >
      <div className={`relative ${locked ? '' : 'badge-halo rounded-full'}`}>
        <BadgeCoin type={type} size={size} locked={locked} />
        {!locked && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-bordeaux text-parchemin shadow-sm">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
      {meta && !locked && (
        <>
          <p className="font-display text-sm leading-tight text-bordeaux">{meta.label}</p>
          <p className="text-[11px] leading-tight text-pierre">{meta.description}</p>
        </>
      )}
    </div>
  )
}

function BadgeMotif({ type }: { type: string }) {
  switch (type) {
    case 'premiere-semaine':
      return (
        <>
          <path d="M13 31 h22" stroke="#8A9A5B" strokeWidth="1.6" strokeLinecap="round" />
          <ellipse cx="24" cy="25" rx="3.4" ry="5" fill="#5D2A41" />
          <path d="M24 20 V16" stroke="#8A9A5B" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M24 18.5 c-1.8 0-3-1-3-2.5 c0 1.5-1.2 2.5-3 2.5"
            stroke="#8A9A5B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )
    case 'premier-mois':
      return (
        <>
          <path d="M24 32 V20" stroke="#8A9A5B" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M24 22 c0-3.5-3-4.5-5-3.5 c2.2 0.8 2.2 2.5 2.2 4.2" fill="#8A9A5B" />
          <path d="M24 26 c0-3.5 3-4.5 5-3.5 c-2.2 0.8-2.2 2.5-2.2 4.2" fill="#8A9A5B" />
        </>
      )
    case 'assidu-huit':
      return (
        <>
          <path
            d="M24 13 c0 4-4 5-4 8 c0 2.6 1.8 4 4 4 c2.2 0 4-1.4 4-4 c0-3-4-4-4-8z"
            fill="#5D2A41"
          />
          <path d="M24 25 v7" stroke="#CFAF5B" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M20 30 c-2.2 0-3.4 1.6-3.4 3.2 c0-1.6-1.2-3.2-3.4-3.2"
            stroke="#CFAF5B"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )
    case 'cinq-resumes':
      return (
        <>
          <rect x="15" y="17" width="18" height="15" rx="2" fill="#5D2A41" />
          <path d="M15 21 h18 M15 25 h18 M15 29 h11" stroke="#CFAF5B" strokeWidth="1.5" />
          <path d="M18 32 v3 l2-1.5 2 1.5 v-3" stroke="#8A9A5B" strokeWidth="1.3" />
        </>
      )
    case 'dix-resumes':
      return (
        <>
          <path
            d="M24 11 v-2.5 M31 13.5 l-1.6-1.6 M35.5 21 h-2.5 M24 37 v2.5 M17 13.5 l1.6-1.6 M12.5 21 h2.5"
            stroke="#CFAF5B"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <rect x="15" y="17" width="18" height="15" rx="2" fill="#5D2A41" />
          <path d="M15 21 h18 M15 25 h18 M15 29 h11" stroke="#CFAF5B" strokeWidth="1.5" />
          <path d="M18 32 v3 l2-1.5 2 1.5 v-3" stroke="#8A9A5B" strokeWidth="1.3" />
        </>
      )
    case 'cycle-1':
    case 'cycle-2':
    case 'cycle-3':
      return (
        <>
          <path
            d="M24 9 c0 3.5-3.2 4-3.2 6.8 c0 2.4 1.6 3.4 3.2 3.4 c1.6 0 3.2-1 3.2-3.4 c0-2.8-3.2-3.3-3.2-6.8z"
            fill="#5D2A41"
          />
          <path d="M24 19.2 v3.2" stroke="#CFAF5B" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="24" cy="27.5" r="6" fill="#CFAF5B" />
          <text
            x="24"
            y="30.5"
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="700"
            fill="#5D2A41"
          >
            {type.split('-')[1]}
          </text>
        </>
      )
    default:
      return <path d="M18 28 h12 M24 20 v8" stroke="#8A9A5B" strokeWidth="1.6" strokeLinecap="round" />
  }
}

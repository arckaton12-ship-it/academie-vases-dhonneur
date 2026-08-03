import { BadgeCoin } from '@/components/Badge'

interface AvatarProps {
  url?: string | null
  firstName?: string
  lastName?: string
  size?: number
  className?: string
  badgeType?: string | null
  onClick?: () => void
  onBadgeClick?: () => void
}

export function Avatar({
  url,
  firstName,
  lastName,
  size = 40,
  className = '',
  badgeType,
  onClick,
  onBadgeClick,
}: AvatarProps) {
  const initials = (((firstName ?? '')[0] ?? '') + ((lastName ?? '')[0] ?? '')).toUpperCase() || 'V'
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) }

  const avatarNode = url ? (
    <img
      src={url}
      alt={initials}
      width={size}
      height={size}
      style={style}
      className={`shrink-0 rounded-full object-cover ring-1 ring-or/50 ${className}`}
    />
  ) : (
    <span
      aria-label="Avatar par défaut"
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-bordeaux font-display font-semibold text-parchemin ring-1 ring-or/40 ${className}`}
    >
      {initials}
    </span>
  )

  const medallion = badgeType ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onBadgeClick?.()
      }}
      aria-label="Salle des badges"
      title="Voir la salle des badges"
      className="absolute -bottom-1 -right-1 z-10 cursor-pointer rounded-full bg-parchemin p-[2px] shadow ring-1 ring-or/60 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-bordeaux"
    >
      <BadgeCoin type={badgeType} size={Math.max(16, Math.round(size * 0.42))} />
    </button>
  ) : null

  const inner = (
    <span className="relative inline-flex shrink-0">
      {avatarNode}
      {medallion}
    </span>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Ouvrir les paramètres du profil"
        title="Paramètres du profil"
        className="cursor-pointer rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-bordeaux"
      >
        {inner}
      </button>
    )
  }

  return inner
}

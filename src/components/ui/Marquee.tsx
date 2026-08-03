import { ReactNode } from 'react'

interface MarqueeProps {
  children: ReactNode
  reverse?: boolean
  pauseOnHover?: boolean
  className?: string
}

/**
 * Défilement horizontal continu, inspiré du composant Marquee de Magic UI,
 * adapté à la charte (masques dégradés parchemin sur les bords).
 * Le contenu est dupliqué pour un bouclage sans rupture.
 */
export function Marquee({
  children,
  reverse = false,
  pauseOnHover = false,
  className = '',
}: MarqueeProps) {
  const row = `flex shrink-0 items-center justify-around gap-6 ${
    reverse ? 'animate-marquee-reverse' : 'animate-marquee'
  } ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`

  return (
    <div className={`group relative flex overflow-hidden ${className}`}>
      <div className={row}>{children}</div>
      <div className={row} aria-hidden="true">
        {children}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-parchemin to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-parchemin to-transparent" />
    </div>
  )
}

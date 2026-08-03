interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

import logoUrl from '@/assets/logo.png'

export function Logo({ size = 34, showText = true, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={logoUrl}
        alt="Logo Académie Vases d'Honneur"
        width={size}
        height={size}
        className="h-auto shrink-0 object-contain"
      />
      {showText && (
        <span className="font-display text-lg font-semibold leading-none text-bordeaux">
          Académie Vases d'Honneur
        </span>
      )}
    </span>
  )
}

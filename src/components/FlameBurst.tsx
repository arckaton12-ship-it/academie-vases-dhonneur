import { useEffect } from 'react'

interface FlameBurstProps {
  onComplete: () => void
}

export function FlameBurst({ onComplete }: FlameBurstProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 800)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/10" />
      <div className="flame-burst relative">
        <svg viewBox="0 0 200 200" width={180} height={180} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="burst-glow" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor="#FFD70080" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="110" r="80" fill="url(#burst-glow)" />
          <path
            d="M100 20 C110 50, 150 70, 150 110 C150 150, 130 175, 100 175 C70 175, 50 150, 50 110 C50 70, 90 50, 100 20Z"
            fill="#D4A017"
          />
          <path
            d="M100 50 C105 70, 130 85, 130 110 C130 140, 115 155, 100 155 C85 155, 70 140, 70 110 C70 85, 95 70, 100 50Z"
            fill="#FFD700"
            opacity="0.6"
          />
          <path
            d="M100 80 C103 92, 115 100, 115 115 C115 130, 108 140, 100 140 C92 140, 85 130, 85 115 C85 100, 97 92, 100 80Z"
            fill="#FFF3B0"
            opacity="0.7"
          />
        </svg>
      </div>
    </div>
  )
}

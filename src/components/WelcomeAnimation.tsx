import { useEffect, useState } from 'react'
import { Logo } from './Logo'

interface Props {
  firstName: string
  onComplete: () => void
}

export function WelcomeAnimation({ firstName, onComplete }: Props) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 100)
    const t2 = setTimeout(() => setPhase('exit'), 2800)
    const t3 = setTimeout(onComplete, 3500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-white transition-opacity duration-700 dark:bg-slate-900 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Golden particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-or/60 animate-pulse"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.12}s`,
            animationDuration: `${1.2 + Math.random() * 0.8}s`,
          }}
        />
      ))}

      {/* Logo pulse */}
      <div className={`transition-all duration-700 ${phase !== 'enter' ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
        <div className="animate-pulse">
          <Logo showText={false} size={72} />
        </div>
      </div>

      {/* Welcome message */}
      <p
        className={`mt-6 font-display text-2xl text-bordeaux transition-all duration-700 delay-300 dark:text-slate-100 ${
          phase === 'visible' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        Bienvenue dans la famille, {firstName || 'Membre'} !
      </p>

      {/* Badge hint */}
      <div
        className={`mt-4 flex items-center gap-2 rounded-full border border-or/30 bg-or/10 px-4 py-2 transition-all duration-700 delay-500 ${
          phase === 'visible' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <span className="text-lg">🏅</span>
        <span className="text-sm font-medium text-or dark:text-or/90">Badge « Nouveau membre » débloqué</span>
      </div>
    </div>
  )
}

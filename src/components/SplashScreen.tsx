import { useCallback, useEffect, useState } from 'react'
import { Logo } from './Logo'

const SPLASH_KEY = 'academy_splash_seen'

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const reduced = useReducedMotion()

  const dismiss = useCallback(() => {
    setPhase((current) => (current === 'out' ? current : 'out'))
  }, [])

  useEffect(() => {
    if (phase !== 'out') return
    const delay = reduced ? 60 : 780
    const timer = setTimeout(onComplete, delay)
    return () => clearTimeout(timer)
  }, [phase, onComplete, reduced])

  useEffect(() => {
    const timer = setTimeout(dismiss, reduced ? 1400 : 4200)
    return () => clearTimeout(timer)
  }, [dismiss, reduced])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])

  return (
    <div
      className={`splash-curtain fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#F7F4EC] px-5 transition-opacity duration-500 dark:bg-[#081114] ${
        phase === 'out' ? 'splash-exit opacity-0' : 'opacity-100'
      }`}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Ouverture de l'Académie Vases d'Honneur"
      style={reduced ? { transitionDuration: '80ms' } : undefined}
    >
      {/* Aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full bg-bordeaux/25 blur-[110px] dark:bg-bordeaux/40" />
        <div className="aurora-blob absolute -right-24 top-1/4 h-[380px] w-[380px] rounded-full bg-or/25 blur-[110px] [animation-delay:-6s] dark:bg-or/20" />
        <div className="aurora-blob absolute -bottom-32 left-1/3 h-[360px] w-[360px] rounded-full bg-olive/20 blur-[120px] [animation-delay:-11s] dark:bg-olive/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.55),transparent_62%)] dark:bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.06),transparent_62%)]" />
      </div>

      {/* Stage */}
      <div className={`splash-stage relative w-full max-w-[360px] ${phase === 'out' ? 'pointer-events-none' : ''}`}>
        <div className="glass-sheet splash-sweep relative overflow-hidden px-7 pb-7 pt-9 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-pierre/70 dark:text-slate-400">
            Académie biblique
          </p>

          <div className="relative mx-auto mt-7 flex h-28 w-28 items-center justify-center">
            <span aria-hidden className="splash-bloom absolute inset-0 rounded-full border border-or/40" />
            <span
              aria-hidden
              className="splash-bloom absolute inset-2 rounded-full border border-bordeaux/25 dark:border-or/25"
              style={{ animationDelay: '0.6s' }}
            />
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/70 bg-white/55 shadow-[0_18px_40px_-18px_rgba(13,48,43,0.45)] backdrop-blur-xl dark:border-white/15 dark:bg-white/10"
              style={reduced ? undefined : { animation: 'softGlow 3.2s ease-in-out infinite' }}
            >
              <Logo showText={false} size={62} />
            </div>
          </div>

          <h1
            className={`mt-7 font-display text-[26px] leading-tight text-bordeaux dark:text-slate-100 ${
              reduced ? '' : 'splash-copy-enter'
            }`}
            style={reduced ? undefined : { animationDelay: '0.35s' }}
          >
            Vases d&apos;Honneur
          </h1>
          <p
            className={`mt-2 text-[13px] text-pierre dark:text-slate-400 ${
              reduced ? '' : 'splash-copy-enter'
            }`}
            style={reduced ? undefined : { animationDelay: '0.5s' }}
          >
            Former. Grandir. Servir le Maître.
          </p>

          <div className="mt-8 h-[3px] w-full overflow-hidden rounded-full bg-pierre/10 dark:bg-white/10">
            <div
              className={`h-full w-full rounded-full bg-gradient-to-r from-bordeaux via-or to-olive dark:from-or dark:via-or-light dark:to-bordeaux ${
                reduced ? 'opacity-80' : 'splash-progress'
              }`}
            />
          </div>

          <p className="mt-4 text-[11px] tracking-wide text-pierre/70 dark:text-slate-500" aria-live="polite">
            Préparation de ton espace…
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
          className="mt-5 w-full rounded-full py-2 text-center text-[11px] font-medium tracking-wide text-pierre/70 transition-colors hover:text-bordeaux dark:text-slate-500 dark:hover:text-or"
        >
          Touche pour entrer
        </button>
      </div>
    </div>
  )
}

export function shouldShowSplash(): boolean {
  try {
    if (sessionStorage.getItem(SPLASH_KEY)) return false
    return true
  } catch {
    return false
  }
}

export function markSplashSeen(): void {
  try {
    sessionStorage.setItem(SPLASH_KEY, '1')
  } catch {
    // ignore
  }
}

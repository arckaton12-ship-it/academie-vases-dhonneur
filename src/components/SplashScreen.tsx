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
  const [exiting, setExiting] = useState(false)
  const reduced = useReducedMotion()

  const dismiss = useCallback(() => {
    if (exiting) return
    setExiting(true)
    setTimeout(onComplete, reduced ? 100 : 500)
  }, [exiting, onComplete, reduced])

  useEffect(() => {
    const timer = setTimeout(dismiss, reduced ? 1200 : 2200)
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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 dark:bg-slate-900 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={dismiss}
      role="dialog"
      aria-label="Écran de bienvenue"
    >
      <div className={reduced ? '' : 'animate-splash-in'}>
        <Logo showText={false} size={80} />
      </div>
      <p
        className={`mt-4 font-display text-lg text-bordeaux dark:text-slate-200 ${
          reduced ? 'opacity-100' : 'animate-fade-in'
        }`}
        style={reduced ? undefined : { animationDelay: '0.4s' }}
      >
        Académie Vases d'Honneur
      </p>
      <p className="mt-6 text-xs text-pierre/60 animate-pulse">
        Touche ou clique pour continuer
      </p>
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

import { useEffect, useState } from 'react'
import { Logo } from './Logo'

const SPLASH_KEY = 'academy_splash_seen'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 500)
    }, 1800)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 dark:bg-slate-900 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="animate-splash-in">
        <Logo showText={false} size={80} />
      </div>
      <p className="mt-4 font-display text-lg text-bordeaux animate-fade-in dark:text-slate-200" style={{ animationDelay: '0.4s' }}>
        Académie Vases d'Honneur
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

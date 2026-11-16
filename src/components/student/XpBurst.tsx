import { useEffect, useRef, useState } from 'react'

interface XpAwardedDetail {
  xp_awarded?: number
  total_xp?: number
  level?: number
}

interface XpBurst {
  id: number
  xp: number
}

export function XpBurst() {
  const [burst, setBurst] = useState<XpBurst | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    function handleAward(event: Event) {
      const detail = (event as CustomEvent<XpAwardedDetail>).detail
      const xp = Number(detail?.xp_awarded)
      if (!Number.isFinite(xp) || xp <= 0) return

      setBurst({ id: Date.now(), xp })
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setBurst(null), 2200)
    }

    window.addEventListener('academie:xp-awarded', handleAward)
    return () => {
      window.removeEventListener('academie:xp-awarded', handleAward)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!burst) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4"
      aria-live="polite"
      role="status"
    >
      <div
        key={burst.id}
        className="xp-burst flex items-center gap-2 rounded-full border border-or/50 bg-bordeaux/95 px-4 py-2 text-sm font-bold text-parchemin shadow-xl backdrop-blur-xl dark:bg-or dark:text-slate-900"
      >
        <span className="text-base" aria-hidden>
          ✦
        </span>
        <span>+{burst.xp} XP</span>
      </div>
    </div>
  )
}

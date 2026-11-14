import { useCallback, useEffect, useMemo, useState } from 'react'
import { Logo } from './Logo'

interface Props {
  firstName: string
  onComplete: () => void
}

const STEPS = [
  {
    kicker: 'Bienvenue',
    title: (name: string) => `Bienvenue, ${name || 'cher membre'}.`,
    body: "Ton compte est prêt. Tu fais maintenant partie de la famille de l'Académie Vases d'Honneur.",
  },
  {
    kicker: 'Ton parcours',
    title: () => 'Un chemin clair, semaine après semaine.',
    body: 'Un cours par semaine, un devoir, un retour de ton modérateur, et une progression visible.',
  },
  {
    kicker: 'Tout est prêt',
    title: () => 'À toi de jouer.',
    body: 'Ton espace, tes cours et tes badges t’attendent. Prends une minute pour explorer.',
  },
]

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

const PILLARS = [
  {
    title: 'Cours hebdomadaires',
    desc: 'Audio, vidéo et support écrit',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: 'Modérateur dédié',
    desc: 'Un accompagnement personnel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Progression et badges',
    desc: 'Chaque effort laisse une trace',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
]

export function WelcomeAnimation({ firstName, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const reduced = useReducedMotion()

  const finish = useCallback(() => {
    if (leaving) return
    setLeaving(true)
    setTimeout(onComplete, reduced ? 80 : 480)
  }, [leaving, onComplete, reduced])

  const next = useCallback(() => {
    setStep((current) => {
      if (current >= STEPS.length - 1) {
        finish()
        return current
      }
      return current + 1
    })
  }, [finish])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'Enter') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish, next])

  const current = STEPS[step]
  const title = useMemo(() => current.title(firstName), [current, firstName])
  const last = step === STEPS.length - 1

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden bg-[#F7F4EC]/92 px-5 backdrop-blur-xl transition-opacity duration-500 dark:bg-[#081114]/92 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue dans l'Académie"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob absolute -left-20 -top-24 h-[380px] w-[380px] rounded-full bg-bordeaux/25 blur-[110px] dark:bg-bordeaux/35" />
        <div className="aurora-blob absolute -right-24 bottom-0 h-[340px] w-[340px] rounded-full bg-or/25 blur-[110px] [animation-delay:-7s] dark:bg-or/20" />
      </div>

      <div className="glass-sheet relative w-full max-w-[380px] overflow-hidden px-7 pb-7 pt-8">
        <button
          type="button"
          onClick={finish}
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-medium text-pierre/70 transition-colors hover:text-bordeaux dark:text-slate-500 dark:hover:text-or"
        >
          Passer
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/60 dark:border-white/15 dark:bg-white/10">
            <Logo showText={false} size={22} />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-or-texte dark:text-or">
              {current.kicker}
            </p>
            <p className="text-[11px] text-pierre/80 dark:text-slate-400">Académie Vases d&apos;Honneur</p>
          </div>
        </div>

        <div key={step} className={reduced ? '' : 'onboarding-step'}>
          <h2 className="mt-7 font-display text-[24px] leading-snug text-bordeaux dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-pierre dark:text-slate-400">
            {current.body}
          </p>

          {step === 0 && (
            <div className="mt-6 space-y-2.5">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/45 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-or/15 text-or">
                    {pillar.icon}
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-bordeaux dark:text-slate-100">{pillar.title}</p>
                    <p className="text-[11px] text-pierre/80 dark:text-slate-500">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 rounded-2xl border border-white/60 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between text-[11px] text-pierre/80 dark:text-slate-500">
                <span>Niveau 1</span>
                <span>Niveau 2</span>
                <span>Niveau 3</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-pierre/10 dark:bg-white/10">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-bordeaux to-or dark:from-or dark:to-or-light" />
              </div>
              <p className="mt-3 text-[11px] text-pierre dark:text-slate-400">
                Tu commences au niveau 1. Ton modérateur valide chaque étape.
              </p>
            </div>
          )}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <div className="flex items-center gap-1.5" aria-hidden>
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === step ? 'w-6 bg-bordeaux dark:bg-or' : 'w-1.5 bg-pierre/25 dark:bg-white/20'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-full bg-bordeaux px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-bordeaux/20 transition-all hover:scale-[1.02] hover:bg-bordeaux/90 active:scale-95 dark:bg-or dark:text-slate-900"
          >
            {last ? 'Entrer dans mon espace' : 'Continuer'}
            {!last && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

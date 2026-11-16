import { useId } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  DAILY_GOAL_OPTIONS,
  dailyGoalMessage,
  dailyGoalPercent,
  suggestDailyAction,
  type DailyGoal,
  type DailyGoalAction,
} from '@/lib/dailyGoal'

interface DailyGoalCardProps {
  todayXp: number
  weekXp: number
  goal: DailyGoal
  streakWeeks: number
  hasCourse: boolean
  courseDone: boolean
  onGoalChange: (goal: DailyGoal) => void
  onAction: (target: DailyGoalAction) => void
  onOpenParcours?: () => void
  variant?: 'full' | 'compact'
}

function GoalRing({ todayXp, goal, size = 92 }: { todayXp: number; goal: number; size?: number }) {
  const gradientId = useId().replace(/:/g, '')
  const percent = dailyGoalPercent(todayXp, goal)
  const stroke = size > 70 ? 8 : 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)
  const center = size / 2

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${todayXp} XP gagnés aujourd'hui sur un objectif de ${goal} XP`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CFAF5B" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-pierre/15 dark:text-white/10"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono font-bold text-bordeaux dark:text-or ${size > 70 ? 'text-xl' : 'text-sm'}`}>
          {todayXp.toLocaleString('fr-FR')}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wide text-pierre dark:text-slate-400">
          / {goal} XP
        </span>
      </div>
    </div>
  )
}

function StreakChip({ weeks }: { weeks: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-or/30 bg-or/10 px-2.5 py-1 text-[11px] font-semibold text-or-texte dark:text-or"
      title={weeks > 0 ? `Série de ${weeks} semaine${weeks > 1 ? 's' : ''}` : 'Nouvelle série à démarrer'}
    >
      <span aria-hidden>🔥</span>
      {weeks > 0 ? `${weeks} sem.` : 'Nouvelle série'}
    </span>
  )
}

export function DailyGoalCard({
  todayXp,
  weekXp,
  goal,
  streakWeeks,
  hasCourse,
  courseDone,
  onGoalChange,
  onAction,
  onOpenParcours,
  variant = 'full',
}: DailyGoalCardProps) {
  const percent = dailyGoalPercent(todayXp, goal)
  const message = dailyGoalMessage(todayXp, goal)
  const suggestion = suggestDailyAction({ todayXp, goal, hasCourse, courseDone })
  const goalReached = todayXp >= goal

  if (variant === 'compact') {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <GoalRing todayXp={todayXp} goal={goal} size={58} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-or-texte dark:text-or">
                Objectif du jour
              </p>
              <StreakChip weeks={streakWeeks} />
            </div>
            <p
              className="mt-1 text-sm font-semibold text-bordeaux dark:text-slate-100"
              aria-live="polite"
            >
              {message}
            </p>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-pierre/10 dark:bg-white/10"
              role="progressbar"
              aria-label="Progression de l'objectif du jour"
              aria-valuemin={0}
              aria-valuemax={goal}
              aria-valuenow={Math.min(todayXp, goal)}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-or to-[#B8860B] transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          {onOpenParcours && (
            <button
              type="button"
              onClick={onOpenParcours}
              aria-label="Voir ma progression"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pierre/20 text-pierre transition-colors hover:border-or/60 hover:text-or"
            >
              →
            </button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-or-texte dark:text-or">
            Boucle quotidienne
          </p>
          <CardTitle className="mt-1">Objectif du jour</CardTitle>
          <CardDescription className="mt-1">
            Un petit pas chaque jour : cours, résumé, quiz ou méditation.
          </CardDescription>
        </div>
        <StreakChip weeks={streakWeeks} />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <GoalRing todayXp={todayXp} goal={goal} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-bordeaux dark:text-slate-100" aria-live="polite">
            {message}
          </p>
          <p className="mt-0.5 text-xs text-pierre dark:text-slate-400">
            {weekXp.toLocaleString('fr-FR')} XP gagnés cette semaine
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-pierre/10 dark:bg-white/10"
            role="progressbar"
            aria-label="Progression de l'objectif du jour"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={Math.min(todayXp, goal)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-or to-[#B8860B] transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Choisir mon objectif quotidien">
        <span className="text-xs text-pierre dark:text-slate-400">Mon objectif :</span>
        {DAILY_GOAL_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onGoalChange(option)}
            aria-pressed={goal === option}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              goal === option
                ? 'border-or bg-or/15 text-or-texte dark:text-or'
                : 'border-pierre/20 text-pierre hover:border-or/50 hover:text-or-texte dark:hover:text-or'
            }`}
          >
            {option} XP
          </button>
        ))}
      </div>

      {suggestion ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-or/25 bg-or/5 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-or-texte dark:text-or">
              Prochaine action
            </p>
            <p className="text-sm font-semibold text-bordeaux dark:text-slate-100">{suggestion.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-or/15 px-2 py-0.5 text-[11px] font-semibold text-or-texte dark:text-or">
              {suggestion.hint}
            </span>
            <Button size="sm" onClick={() => onAction(suggestion.target)}>
              Y aller →
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-olive/30 bg-olive/10 px-4 py-3">
          <p className="text-sm font-semibold text-olive">
            {goalReached ? 'Objectif atteint. Tu peux t’arrêter là ou continuer pour ta série.' : ''}
          </p>
          <Button size="sm" variant="outline" onClick={() => onAction('devoirs')}>
            Continuer →
          </Button>
        </div>
      )}
    </Card>
  )
}

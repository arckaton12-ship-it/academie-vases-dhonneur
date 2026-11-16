export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const

export type DailyGoal = (typeof DAILY_GOAL_OPTIONS)[number]

export type DailyGoalAction = 'course' | 'devoirs'

export const DEFAULT_DAILY_GOAL: DailyGoal = 30
export const DAILY_GOAL_STORAGE_KEY = 'academie:daily-goal'

export function isDailyGoal(value: unknown): value is DailyGoal {
  return DAILY_GOAL_OPTIONS.includes(value as DailyGoal)
}

export function readDailyGoal(
  storage: Pick<Storage, 'getItem'> | null = typeof window !== 'undefined' ? window.localStorage : null
): DailyGoal {
  try {
    const raw = storage?.getItem(DAILY_GOAL_STORAGE_KEY)
    const value = Number(raw)
    return isDailyGoal(value) ? value : DEFAULT_DAILY_GOAL
  } catch {
    return DEFAULT_DAILY_GOAL
  }
}

export function writeDailyGoal(
  goal: DailyGoal,
  storage: Pick<Storage, 'setItem'> | null = typeof window !== 'undefined' ? window.localStorage : null
): void {
  try {
    storage?.setItem(DAILY_GOAL_STORAGE_KEY, String(goal))
  } catch {
    // Stockage indisponible : l'objectif reste valable pour la session.
  }
}

export function dailyGoalPercent(todayXp: number, goal: number): number {
  if (!Number.isFinite(todayXp) || !Number.isFinite(goal) || goal <= 0) return 0
  return Math.min(Math.max((todayXp / goal) * 100, 0), 100)
}

export function dailyGoalMessage(todayXp: number, goal: number): string {
  if (todayXp >= goal) return 'Objectif atteint, ta constance porte du fruit.'
  const remaining = Math.max(goal - Math.max(todayXp, 0), 0)
  return `Encore ${remaining} XP pour remplir ton anneau du jour.`
}

export interface DailyGoalSuggestion {
  label: string
  hint: string
  target: DailyGoalAction
}

export function suggestDailyAction({
  todayXp,
  goal,
  hasCourse,
  courseDone,
}: {
  todayXp: number
  goal: number
  hasCourse: boolean
  courseDone: boolean
}): DailyGoalSuggestion | null {
  if (todayXp >= goal) return null

  if (hasCourse && !courseDone) {
    return {
      label: 'Termine le cours de la semaine',
      hint: '+25 XP',
      target: 'course',
    }
  }

  return {
    label: 'Dépose ton résumé ou réussis un quiz',
    hint: '+10 à +30 XP',
    target: 'devoirs',
  }
}

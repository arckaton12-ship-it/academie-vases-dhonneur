import { describe, expect, it } from 'vitest'
import {
  DAILY_GOAL_STORAGE_KEY,
  dailyGoalMessage,
  dailyGoalPercent,
  readDailyGoal,
  suggestDailyAction,
  writeDailyGoal,
} from './dailyGoal'

function storageWith(value: string | null) {
  return {
    getItem: (key: string) => (key === DAILY_GOAL_STORAGE_KEY ? value : null),
  }
}

describe('objectif quotidien', () => {
  it('borne la progression entre 0 et 100 %', () => {
    expect(dailyGoalPercent(0, 30)).toBe(0)
    expect(dailyGoalPercent(15, 30)).toBe(50)
    expect(dailyGoalPercent(60, 30)).toBe(100)
    expect(dailyGoalPercent(-5, 30)).toBe(0)
    expect(dailyGoalPercent(10, 0)).toBe(0)
  })

  it('relit un objectif valide et ignore une valeur inconnue', () => {
    expect(readDailyGoal(storageWith('20'))).toBe(20)
    expect(readDailyGoal(storageWith('999'))).toBe(30)
    expect(readDailyGoal(storageWith(null))).toBe(30)
  })

  it('écrit l’objectif choisi', () => {
    const saved: Record<string, string> = {}
    writeDailyGoal(50, {
      setItem: (key, value) => {
        saved[key] = value
      },
    })
    expect(saved[DAILY_GOAL_STORAGE_KEY]).toBe('50')
  })

  it('annonce le reste à gagner puis la réussite', () => {
    expect(dailyGoalMessage(12, 30)).toContain('18 XP')
    expect(dailyGoalMessage(30, 30)).toContain('Objectif atteint')
    expect(dailyGoalMessage(45, 30)).toContain('Objectif atteint')
  })

  it('propose le cours de la semaine en priorité', () => {
    expect(
      suggestDailyAction({ todayXp: 5, goal: 30, hasCourse: true, courseDone: false })
    ).toEqual({
      label: 'Termine le cours de la semaine',
      hint: '+25 XP',
      target: 'course',
    })
  })

  it('propose un résumé ou un quiz quand le cours est déjà fait', () => {
    expect(
      suggestDailyAction({ todayXp: 5, goal: 30, hasCourse: true, courseDone: true })
    ).toMatchObject({ target: 'devoirs' })
    expect(
      suggestDailyAction({ todayXp: 5, goal: 30, hasCourse: false, courseDone: false })
    ).toMatchObject({ target: 'devoirs' })
  })

  it('ne propose plus rien quand l’objectif est atteint', () => {
    expect(
      suggestDailyAction({ todayXp: 30, goal: 30, hasCourse: true, courseDone: false })
    ).toBeNull()
  })
})

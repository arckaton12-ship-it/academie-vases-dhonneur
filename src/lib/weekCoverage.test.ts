import { describe, expect, it } from 'vitest'
import {
  auditWeekCoverage,
  auditWeekCoverageByClass,
  formatMissingWeeks,
  groupWeeksIntoGaps,
} from './weekCoverage'

describe('auditWeekCoverage', () => {
  it('ne signale rien pour une suite complète', () => {
    const report = auditWeekCoverage([{ week: 1 }, { week: 2 }, { week: 3 }])
    expect(report.missing).toEqual([])
    expect(report.duplicates).toEqual([])
    expect(report.message).toBeNull()
    expect(report.empty).toBe(false)
  })

  it('détecte le trou de la semaine 3 en Classe 2', () => {
    const report = auditWeekCoverage([{ week: 1 }, { week: 2 }, { week: 4 }, { week: 5 }])
    expect(report.missing).toEqual([3])
    expect(report.gaps).toEqual([{ start: 3, end: 3, weeks: [3] }])
    expect(report.message).toContain('semaine 3')
  })

  it('signale une classe qui démarre après la semaine 1', () => {
    const report = auditWeekCoverage([{ week: 4 }, { week: 5 }])
    expect(report.missing).toEqual([1, 2, 3])
  })

  it('accepte une plage explicite plus longue que les données', () => {
    const report = auditWeekCoverage([{ week: 1 }, { week: 2 }], { expectedEnd: 4 })
    expect(report.missing).toEqual([3, 4])
  })

  it('signale les doublons de semaine', () => {
    const report = auditWeekCoverage([{ week: 1 }, { week: 1 }, { week: 2 }])
    expect(report.duplicates).toEqual([1])
    expect(report.message).toContain('en double')
  })

  it('gère une classe vide', () => {
    const report = auditWeekCoverage([])
    expect(report.empty).toBe(true)
    expect(report.message).toContain('Aucun cours')
  })

  it('ignore les semaines invalides', () => {
    const report = auditWeekCoverage([{ week: 1 }, { week: 0 }, { week: -2 }, { week: 2 }])
    expect(report.weeks).toEqual([1, 2])
    expect(report.missing).toEqual([])
  })
})

describe('groupWeeksIntoGaps', () => {
  it('regroupe les plages contiguës', () => {
    expect(groupWeeksIntoGaps([3, 4, 5, 8])).toEqual([
      { start: 3, end: 5, weeks: [3, 4, 5] },
      { start: 8, end: 8, weeks: [8] },
    ])
  })

  it('dédoublonne et trie', () => {
    expect(groupWeeksIntoGaps([5, 3, 5, 3]).map((g) => g.start)).toEqual([3, 5])
  })
})

describe('formatMissingWeeks', () => {
  it('formate une semaine seule', () => {
    expect(formatMissingWeeks([3])).toBe('semaine 3')
  })

  it('formate une plage', () => {
    expect(formatMissingWeeks([3, 4, 5])).toBe('semaines 3 à 5')
  })

  it('formate plusieurs plages', () => {
    expect(formatMissingWeeks([2, 4, 5])).toBe('semaine 2, semaines 4 à 5')
  })
})

describe('auditWeekCoverageByClass', () => {
  it('isole les cours par classe', () => {
    const result = auditWeekCoverageByClass(
      [
        { id: 'c1', name: 'Classe 1' },
        { id: 'c2', name: 'Classe 2' },
      ],
      [
        { class_id: 'c1', week: 1 },
        { class_id: 'c1', week: 2 },
        { class_id: 'c2', week: 1 },
        { class_id: 'c2', week: 2 },
        { class_id: 'c2', week: 4 },
      ]
    )

    expect(result[0].report.missing).toEqual([])
    expect(result[1].report.missing).toEqual([3])
  })
})

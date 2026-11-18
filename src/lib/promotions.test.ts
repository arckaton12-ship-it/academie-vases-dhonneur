import { describe, it, expect } from 'vitest'
import {
  academicYearStart,
  buildPromotionOptions,
  currentAcademicYear,
  graduationLevelFor,
  isAlumni,
  nextPromotion,
  promotionFromDate,
  studentStatus,
  studentStatusLabel,
} from './promotions'

const NOW = new Date('2026-11-18T12:00:00.000Z')

describe('promotions', () => {
  it('bascule d’année académique en juillet', () => {
    expect(academicYearStart(new Date('2026-06-30T12:00:00.000Z'))).toBe(2025)
    expect(academicYearStart(new Date('2026-07-01T12:00:00.000Z'))).toBe(2026)
    expect(academicYearStart(new Date('2026-08-09T12:00:00.000Z'))).toBe(2026)
    expect(academicYearStart(new Date('2027-02-01T12:00:00.000Z'))).toBe(2026)
  })

  it('déduit la promotion de la date d’inscription', () => {
    expect(promotionFromDate('2026-08-09T19:47:48.000Z', NOW)).toEqual({
      year: 2026,
      label: 'Promotion 2026–2027',
      shortLabel: '2026–2027',
      isCurrent: true,
    })
    expect(promotionFromDate('2025-09-01T12:00:00.000Z', NOW)?.isCurrent).toBe(false)
    expect(promotionFromDate(null, NOW)).toBeNull()
    expect(promotionFromDate('pas-une-date', NOW)).toBeNull()
  })

  it('connaît l’année académique courante', () => {
    expect(currentAcademicYear(NOW)).toBe(2026)
    expect(currentAcademicYear(new Date('2027-07-02T00:00:00.000Z'))).toBe(2027)
  })

  it('annonce la prochaine promotion', () => {
    expect(nextPromotion(NOW)).toEqual({
      year: 2027,
      label: 'Promotion 2027–2028',
      shortLabel: '2027–2028',
      isCurrent: false,
    })
    expect(nextPromotion(new Date('2027-07-02T00:00:00.000Z')).shortLabel).toBe('2028–2029')
  })

  it('liste les promotions présentes, la plus récente d’abord', () => {
    const options = buildPromotionOptions(
      [
        { created_at: '2026-08-09T00:00:00.000Z' },
        { created_at: '2025-09-01T00:00:00.000Z' },
        { created_at: null },
      ],
      NOW
    )
    expect(options.map((o) => o.year)).toEqual([2026, 2025])
    expect(options[0].label).toBe('Promotion 2026–2027')
  })

  it('classe les statuts sans perdre les anciens', () => {
    expect(studentStatus({ active: true, class: { level: 1 } }, 4)).toBe('ACTIF')
    expect(studentStatus({ active: true, class: { level: 4 } }, 4)).toBe('DIPLOME')
    expect(studentStatus({ active: false, class: { level: 4 } }, 4)).toBe('DIPLOME')
    expect(studentStatus({ active: false, class: { level: 2 } }, 4)).toBe('ARCHIVE')
    expect(studentStatus({ active: true, class: null }, 4)).toBe('SANS_CLASSE')
    expect(isAlumni('DIPLOME')).toBe(true)
    expect(isAlumni('ARCHIVE')).toBe(true)
    expect(isAlumni('ACTIF')).toBe(false)
    expect(studentStatusLabel('DIPLOME')).toBe('Diplômé')
  })

  it('ne confond pas la dernière classe avec la graduation', () => {
    const sansGraduation = [
      { name: 'Classe 1', level: 1 },
      { name: 'Classe 2', level: 2 },
      { name: 'Classe 3', level: 3 },
    ]
    expect(graduationLevelFor(sansGraduation)).toBeNull()
    expect(studentStatus({ active: true, class: { level: 3 } }, graduationLevelFor(sansGraduation))).toBe('ACTIF')

    const avecGraduation = [...sansGraduation, { name: 'Graduation', level: 4 }]
    expect(graduationLevelFor(avecGraduation)).toBe(4)
    expect(studentStatus({ active: true, class: { level: 4 } }, graduationLevelFor(avecGraduation))).toBe('DIPLOME')
  })
})

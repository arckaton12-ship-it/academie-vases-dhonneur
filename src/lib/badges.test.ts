import { describe, it, expect } from 'vitest'
import { BADGES, BADGE_ORDER, isBadgeKey, getBadgesByCategory, type BadgeKey } from './badges'

describe('BADGES', () => {
  it('has 18 badges defined', () => {
    expect(Object.keys(BADGES)).toHaveLength(18)
  })

  it('every badge has label, description, category', () => {
    for (const [key, badge] of Object.entries(BADGES)) {
      expect(badge.label).toBeTruthy()
      expect(badge.description).toBeTruthy()
      expect(['attendance', 'completion', 'xp', 'achievement']).toContain(badge.category)
    }
  })

  it('BADGE_ORDER contains all badge keys', () => {
    expect(BADGE_ORDER).toHaveLength(18)
    for (const key of BADGE_ORDER) {
      expect(BADGES[key]).toBeDefined()
    }
  })

  it('BADGE_ORDER has no duplicates', () => {
    expect(new Set(BADGE_ORDER).size).toBe(BADGE_ORDER.length)
  })
})

describe('isBadgeKey', () => {
  it('returns true for valid badge keys', () => {
    expect(isBadgeKey('premiere-semaine')).toBe(true)
    expect(isBadgeKey('mille-xp')).toBe(true)
    expect(isBadgeKey('parole-ancree')).toBe(true)
  })

  it('returns false for invalid keys', () => {
    expect(isBadgeKey('nonexistent')).toBe(false)
    expect(isBadgeKey('')).toBe(false)
    expect(isBadgeKey('premiere')).toBe(false)
  })
})

describe('getBadgesByCategory', () => {
  it('returns attendance badges', () => {
    const badges = getBadgesByCategory('attendance')
    expect(badges.length).toBeGreaterThan(0)
    for (const key of badges) {
      expect(BADGES[key].category).toBe('attendance')
    }
  })

  it('returns xp badges', () => {
    const badges = getBadgesByCategory('xp')
    expect(badges).toContain('cent-xp')
    expect(badges).toContain('cinq-cents-xp')
    expect(badges).toContain('mille-xp')
  })

  it('returns completion badges', () => {
    const badges = getBadgesByCategory('completion')
    expect(badges).toContain('cinq-resumes')
    expect(badges).toContain('cycle-1')
    expect(badges).toContain('parole-ancree')
  })

  it('returns achievement badges', () => {
    const badges = getBadgesByCategory('achievement')
    expect(badges).toContain('quiz-parfait')
    expect(badges).toContain('service-actif')
    expect(badges).toContain('meditation-dix')
  })

  it('returns empty for unknown category', () => {
    const badges = getBadgesByCategory('unknown' as any)
    expect(badges).toHaveLength(0)
  })
})

import { describe, it, expect } from 'vitest'
import { generateSecurePassword } from './rateLimit'

describe('generateSecurePassword', () => {
  it('generates a password of the specified length', () => {
    const pw = generateSecurePassword(20)
    expect(pw).toHaveLength(20)
  })

  it('default length is 14', () => {
    const pw = generateSecurePassword()
    expect(pw).toHaveLength(14)
  })

  it('contains at least one uppercase letter', () => {
    const pw = generateSecurePassword(20)
    expect(pw).toMatch(/[A-Z]/)
  })

  it('contains at least one lowercase letter', () => {
    const pw = generateSecurePassword(20)
    expect(pw).toMatch(/[a-z]/)
  })

  it('contains at least one digit', () => {
    const pw = generateSecurePassword(20)
    expect(pw).toMatch(/[0-9]/)
  })

  it('contains at least one special character', () => {
    const pw = generateSecurePassword(20)
    expect(pw).toMatch(/[!@#$%&*]/)
  })

  it('generates different passwords each time', () => {
    const passwords = new Set<string>()
    for (let i = 0; i < 20; i++) {
      passwords.add(generateSecurePassword(14))
    }
    expect(passwords.size).toBeGreaterThan(1)
  })
})

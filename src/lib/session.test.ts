import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTH_STORAGE_KEY,
  clearStoredSession,
  getStoredAccessToken,
  readStoredSession,
  withTimeout,
} from './session'

class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value))
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }
  get length() {
    return this.store.size
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  vi.stubGlobal('localStorage', storage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function writeSession(payload: unknown) {
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
}

describe('readStoredSession', () => {
  it('retourne null sans session', () => {
    expect(readStoredSession()).toBeNull()
  })

  it('lit une session au format Supabase (current)', () => {
    writeSession({
      current: {
        access_token: 'jeton',
        user: { id: 'u1', email: 'a@b.c', user_metadata: { role: 'ETUDIANT' } },
      },
    })
    expect(readStoredSession()).toEqual({
      access_token: 'jeton',
      user: { id: 'u1', email: 'a@b.c', user_metadata: { role: 'ETUDIANT' } },
    })
  })

  it('accepte aussi une session non encapsulée', () => {
    writeSession({ access_token: 'jeton', user: { id: 'u2' } })
    expect(readStoredSession()?.user.id).toBe('u2')
  })

  it('complète les métadonnées absentes', () => {
    writeSession({ access_token: 'jeton', user: { id: 'u3' } })
    expect(readStoredSession()?.user.user_metadata).toEqual({})
  })

  it('rejette une session incomplète', () => {
    writeSession({ current: { user: { id: 'u1' } } })
    expect(readStoredSession()).toBeNull()
  })

  it('résiste à un JSON invalide', () => {
    storage.setItem(AUTH_STORAGE_KEY, '{invalide')
    expect(readStoredSession()).toBeNull()
  })

  it('résiste à un stockage indisponible', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('bloqué')
      },
    })
    expect(readStoredSession()).toBeNull()
  })
})

describe('getStoredAccessToken / clearStoredSession', () => {
  it('expose le jeton courant', () => {
    writeSession({ access_token: 'abc', user: { id: 'u1' } })
    expect(getStoredAccessToken()).toBe('abc')
  })

  it('supprime la session', () => {
    writeSession({ access_token: 'abc', user: { id: 'u1' } })
    clearStoredSession()
    expect(readStoredSession()).toBeNull()
  })
})

describe('withTimeout', () => {
  it('résout avant le délai', async () => {
    await expect(withTimeout(Promise.resolve(42), 500)).resolves.toBe(42)
  })

  it('rejette avec un message explicite au-delà du délai', async () => {
    await expect(withTimeout(new Promise(() => undefined), 20, 'test')).rejects.toThrow(
      /Délai dépassé.*test/
    )
  })

  it('propage l’erreur d’origine', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 500)).rejects.toThrow('boom')
  })
})

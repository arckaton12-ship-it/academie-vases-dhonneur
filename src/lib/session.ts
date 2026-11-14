/**
 * Couche unique de lecture de session.
 *
 * Règle du projet : on lit le JWT directement dans localStorage, de façon
 * synchrone, sans jamais appeler supabase.auth.getSession() ni getUser(),
 * qui peuvent rester bloqués quand le refresh token est expiré.
 */

export const AUTH_STORAGE_KEY = 'academie-vh-auth'

/** Délai maximal accordé à une vérification de rôle côté API. */
export const ROLE_CHECK_TIMEOUT_MS = 6000

export interface StoredSession {
  access_token: string
  user: {
    id: string
    email?: string
    user_metadata: Record<string, unknown>
  }
}

interface RawSession {
  access_token?: string
  user?: {
    id?: string
    email?: string
    user_metadata?: Record<string, unknown>
  }
}

/** Lit la session stockée. Ne fait aucun appel réseau, ne peut pas bloquer. */
export function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const current = (parsed?.current ?? parsed) as RawSession | null
    if (!current?.access_token || !current?.user?.id) return null
    return {
      access_token: current.access_token,
      user: {
        id: current.user.id,
        email: current.user.email,
        user_metadata: current.user.user_metadata ?? {},
      },
    }
  } catch {
    return null
  }
}

/** Jeton d'accès courant, ou null. Utile pour les appels REST directs. */
export function getStoredAccessToken(): string | null {
  return readStoredSession()?.access_token ?? null
}

/** Supprime la session locale (déconnexion, compte désactivé, jeton invalide). */
export function clearStoredSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // stockage indisponible : rien à faire
  }
}

/**
 * Exécute une promesse avec un délai maximal. Rejette avec une erreur
 * explicite au lieu de laisser l'interface bloquée indéfiniment.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'opération'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Délai dépassé (${ms} ms) : ${label}`))
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

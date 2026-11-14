import { supabase } from './supabase'
import { uploadAvatar } from './avatars'
import { Sentry } from './sentry'
import { readStoredSession, ROLE_CHECK_TIMEOUT_MS, type StoredSession } from './session'

export type UserRole = 'ETUDIANT' | 'MODERATEUR' | 'ADMINISTRATEUR' | 'ADMIN_CLASSE'

export interface SignUpInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  tribe?: string
  department?: string
  role: UserRole
  avatarFile?: File
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)))
    }
  }
  throw lastError
}

export async function signUp(input: SignUpInput) {
  if (input.role !== 'ETUDIANT') {
    throw new Error(
      "La création d'un compte administrateur ou modérateur est réservée à l'administration."
    )
  }

  let data: Awaited<ReturnType<typeof supabase.auth.signUp>>['data']
  try {
    const result = await withRetry(() =>
      supabase.auth.signUp({
        email: input.email,
        password: input.password,
      })
    )
    data = result.data
    if (result.error) throw result.error
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('rate') || msg.includes('too many') || msg.includes('429')) {
      throw new Error("Trop d'inscriptions simultanées. Réessaie dans quelques secondes.")
    }
    if (msg.includes('already registered') || msg.includes('already exists')) {
      throw new Error("Un compte existe déjà avec cet email. Connecte-toi plutôt.")
    }
    throw err
  }

  if (!data?.user) throw new Error("Inscription incomplète, réessaie.")

  const avatarUrl = input.avatarFile ? await uploadAvatar(input.avatarFile, data.user.id) : null

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    email: input.email,
    phone: input.phone ?? null,
    first_name: input.firstName,
    last_name: input.lastName,
    tribe: input.tribe ?? null,
    department: input.department ?? null,
    avatar_url: avatarUrl,
    role: input.role,
  }, { onConflict: 'id', ignoreDuplicates: false })
  if (profileError) {
    console.error('[signUp] Profile creation failed, auth user may be orphaned:', profileError.message)
    throw new Error(`Profil non créé (${profileError.message}). Contacte l'administrateur.`)
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('[signIn] Supabase error:', JSON.stringify({ message: error.message, status: error.status }))
    Sentry.setTag('auth.email', email)
    Sentry.captureMessage(`Échec de connexion: ${error.message}`, 'warning')
    throw error
  }
  if (data.user?.id) {
    Sentry.setUser({
      id: data.user.id,
      email: email.toLowerCase(),
      username: data.user.user_metadata?.role ? String(data.user.user_metadata.role) : undefined,
    })
  }
  return data
}

export async function signOut() {
  Sentry.setUser(null)
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Envoie un lien de réinitialisation si un compte existe pour cet email.
 * On ne révèle jamais si l'adresse est connue ou non (anti-énumération).
 */
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
  })
  if (!error) return

  const msg = error.message.toLowerCase()
  if (msg.includes('rate') || msg.includes('too many') || msg.includes('429')) {
    throw new Error('Trop de demandes. Réessaie dans quelques minutes.')
  }
  throw new Error("L'envoi de l'email a échoué. Vérifie ta connexion et réessaie.")
}

export async function changePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('same') || msg.includes('different')) {
      throw new Error('Choisis un mot de passe différent de l’ancien.')
    }
    if (msg.includes('weak') || msg.includes('password')) {
      throw new Error('Mot de passe trop simple. Utilise au moins 8 caractères.')
    }
    throw new Error('Impossible de mettre à jour le mot de passe. Réessaie.')
  }

  // Un mot de passe réinitialisé ne doit plus être marqué comme temporaire.
  const userId = data.user?.id ?? getSafeSession()?.user.id
  if (userId) {
    await supabase.from('profiles').update({ must_change_password: false }).eq('id', userId)
  }
  return data
}

/**
 * Session courante, lue de façon synchrone dans localStorage.
 * Aucun appel réseau : cette fonction ne peut pas bloquer.
 */
export function getSafeSession(): StoredSession | null {
  return readStoredSession()
}

export async function getCurrentProfile() {
  const session = readStoredSession()
  if (!session) return null

  const userId = session.user.id
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), ROLE_CHECK_TIMEOUT_MS)

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    const accessToken = session.access_token

    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${userId}&limit=1`,
      {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${accessToken || anonKey}`,
          'Content-Type': 'application/json',
        },
        signal: ac.signal,
      }
    )

    if (!res.ok) return null
    const rows = await res.json()
    return rows?.[0] ?? null
  } catch (err) {
    const msg = err instanceof Error ? JSON.stringify({ message: err.message, stack: err.stack }) : JSON.stringify(err)
    console.error('[getCurrentProfile] Unexpected error:', msg)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export interface ProfileUpdateInput {
  firstName: string
  lastName: string
  phone?: string
  tribe?: string
  department?: string
  activeBadge?: string | null
}

export async function updateProfileInfo(input: ProfileUpdateInput) {
  const session = getSafeSession()
  if (!session) throw new Error('Session introuvable.')
  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone || null,
      tribe: input.tribe || null,
      department: input.department || null,
      ...(input.activeBadge !== undefined ? { active_badge: input.activeBadge } : {}),
    })
    .eq('id', session.user.id)
  if (error) throw error
}

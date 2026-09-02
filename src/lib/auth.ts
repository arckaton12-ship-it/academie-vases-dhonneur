import { supabase } from './supabase'
import { uploadAvatar } from './avatars'

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
    throw error
  }
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

const STORAGE_KEY = 'academie-vh-auth'

export function getSafeSession(): { access_token: string; user: { id: string; email?: string; user_metadata: Record<string, unknown> } } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const current = parsed?.current ?? parsed
    if (current?.access_token && current?.user?.id) {
      return {
        access_token: current.access_token,
        user: {
          id: current.user.id,
          email: current.user.email,
          user_metadata: current.user.user_metadata ?? {},
        },
      }
    }
    return null
  } catch {
    return null
  }
}

export async function getCurrentProfile() {
  const STORAGE_KEY = 'academie-vh-auth'

  try {
    let userId: string | null = null

    // Read session directly from localStorage — never hangs
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const current = parsed?.current ?? parsed
        if (current?.user?.id) userId = current.user.id
      }
    } catch {
      // localStorage parse error
    }

    if (!userId) return null

    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 8000)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
      // Read access_token from localStorage for the API call
      let accessToken = ''
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          const current = parsed?.current ?? parsed
          accessToken = current?.access_token ?? ''
        }
      } catch { /* ignore */ }

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
    } finally {
      clearTimeout(timer)
    }
  } catch (err) {
    const msg = err instanceof Error ? JSON.stringify({ message: err.message, stack: err.stack }) : JSON.stringify(err)
    console.error('[getCurrentProfile] Unexpected error:', msg)
    return null
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

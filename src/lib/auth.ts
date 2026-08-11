import { supabase } from './supabase'
import { uploadAvatar } from './avatars'

export type UserRole = 'ETUDIANT' | 'MODERATEUR' | 'ADMINISTRATEUR'

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

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email: input.email,
    phone: input.phone ?? null,
    first_name: input.firstName,
    last_name: input.lastName,
    tribe: input.tribe ?? null,
    department: input.department ?? null,
    avatar_url: avatarUrl,
    role: input.role,
  })
  if (profileError) {
    if (profileError.message?.includes('duplicate') || profileError.code === '23505') {
      throw new Error("Un profil existe déjà pour cet utilisateur.")
    }
    throw profileError
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentProfile() {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single()
  if (error) throw error
  return data
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
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Session introuvable.')
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
    .eq('id', userData.user.id)
  if (error) throw error
}

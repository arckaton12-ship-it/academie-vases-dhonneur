import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { signUp, signIn, UserRole } from '@/lib/auth'
import { isAvatarFile } from '@/lib/avatars'
import { canSignUp, recordSignUp } from '@/lib/rateLimit'

const TRIBUS = ['Ruben', 'Siméon', 'Lévi', 'Juda', 'Zabulon', 'Issacar', 'Dan', 'Gad', 'Aser', 'Nephtali', 'Joseph', 'Benjamin', 'Aucune']
const DEPARTEMENTS = ['ACCUEIL', 'ADMINISTRATION', 'ADN', 'ACADÉMIE D\'HONNEUR', 'BAPTÊME', 'BLOOM', 'CHANTRES', 'COMMUNICATION', 'COMPTABILITÉ', 'DÉCORATION', 'DIGITAL', 'ENFANT D\'HONNEUR', 'ELEEO', 'GDC', 'INTERCESSION', 'LOGE PASTORALE', 'LEAMANS', 'MÉDECINE D\'HONNEUR', 'MOYENS GÉNÉRAUX', 'MRES', 'PLUME D\'HONNEUR', 'PROTOCOLE', 'COEUR D\'HONNEUR', 'SAINTE CÈNE', 'EVANGÉLISATION', 'AUCUN']

interface AuthFormProps {
  mode: 'signup' | 'signin'
  role: UserRole
  onSuccess: () => void
}

export function AuthForm({ mode, role, onSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [tribe, setTribe] = useState('')
  const [department, setDepartment] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (mode === 'signup' && avatarFile && !isAvatarFile(avatarFile)) {
      setError('La photo doit être une image de 5 Mo maximum.')
      return
    }
    if (mode === 'signup' && !canSignUp()) {
      setError('Tentatives trop fréquentes. Réessaie dans quelques secondes.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp({
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
          tribe: tribe || undefined,
          department: department || undefined,
          role,
          avatarFile: avatarFile ?? undefined,
        })
        recordSignUp()
      } else {
        await signIn(email, password)
      }
      onSuccess()
    } catch (err: any) {
      console.error('[AuthForm] Error:', err)
      const msg = err?.message || err?.error_description || err?.msg || ''
      if (msg.includes('rate') || msg.includes('too many') || msg.includes('429')) {
        setError('Trop de tentatives. Réessaie dans quelques secondes.')
      } else if (msg.includes('already') || msg.includes('exist')) {
        setError('Un compte existe déjà avec cet email. Connecte-toi plutôt.')
      } else if (msg.includes('Invalid') || msg.includes('invalid') || msg.includes('credentials')) {
        setError('Email ou mot de passe incorrect.')
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setError('Problème de connexion. Vérifie ta connexion internet.')
      } else if (msg) {
        setError(msg)
      } else {
        setError("Une erreur est survenue. Réessaie.")
      }
    } finally {
      setLoading(false)
    }
  }

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAvatarFile(e.target.files?.[0] ?? null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'signup' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tribe">Tribu</Label>
              <select id="tribe" value={tribe} onChange={(e) => setTribe(e.target.value)} className="block w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none">
                <option value="">—</option>
                {TRIBUS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="department">Département</Label>
              <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="block w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none">
                <option value="">—</option>
                {DEPARTEMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="avatar">Photo de profil (optionnel)</Label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="block w-full text-sm text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-sm file:text-parchemin hover:file:bg-[#4a2234]"
            />
            {avatarFile && <p className="mt-1 text-xs text-pierre">Sélectionnée : {avatarFile.name}</p>}
          </div>
        </>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-pierre hover:text-bordeaux"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        {mode === 'signup' && <p className="mt-1 text-xs text-pierre">Au moins 6 caractères</p>}
      </div>

      <FieldError>{error ?? undefined}</FieldError>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Chargement…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
      </Button>
    </form>
  )
}

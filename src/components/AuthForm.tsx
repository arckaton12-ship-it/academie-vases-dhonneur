import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { signUp, signIn, UserRole } from '@/lib/auth'
import { isAvatarFile } from '@/lib/avatars'
import { canSignUp, recordSignUp } from '@/lib/rateLimit'

const TRIBUS = ['Lévi', 'Juda', 'Siméon', 'Ruben', 'Zabulon', 'Issacar', 'Dan', 'Nephtali', 'Gad', 'Aser', 'Manassé', 'Éphraïm', 'Benjamin', 'Aucune']
const DEPARTEMENTS = ['Intercession', 'Chantre', 'Communication', 'Accueil', 'Gestion des Cultes', "Médecine d'Honneur", 'Portier', 'Évangélisation', 'Amis des Nouveaux (ADN)', 'Social', 'Aucun']

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
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
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === 'signup' && <p className="mt-1 text-xs text-pierre">Au moins 6 caractères</p>}
      </div>

      <FieldError>{error ?? undefined}</FieldError>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Chargement…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
      </Button>
    </form>
  )
}

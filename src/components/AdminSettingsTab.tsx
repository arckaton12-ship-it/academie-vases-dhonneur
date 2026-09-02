import { FormEvent, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/AvatarUpload'
import { SoundToggle } from '@/components/SoundToggle'
import { supabase } from '@/lib/supabase'
import { toast, toastError } from '@/components/ui/Toast'

interface AdminProfile {
  id: string
  avatar_url?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

interface AdminSettingsTabProps {
  profile: AdminProfile
  formFirst: string
  formName: string
  formEmail: string
  setFormFirst: (v: string) => void
  setFormName: (v: string) => void
  setFormEmail: (v: string) => void
  profileSaving: boolean
  profileError: string | null
  profileDone: string | null
  onSaveProfile: (e: FormEvent) => void
  onSignOut: () => void
}

export function AdminSettingsTab({
  profile,
  formFirst,
  formName,
  formEmail,
  setFormFirst,
  setFormName,
  setFormEmail,
  profileSaving,
  profileError,
  profileDone,
  onSaveProfile,
  onSignOut,
}: AdminSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Section: Profil */}
      <Card>
        <CardTitle>Profil</CardTitle>
        <CardDescription className="mt-1 mb-4">
          Photo et informations personnelles.
        </CardDescription>
        <AvatarUpload
          url={profile.avatar_url ?? undefined}
          firstName={profile.first_name ?? undefined}
          lastName={profile.last_name ?? undefined}
          userId={profile.id}
          onSaved={() => {}}
        />
      </Card>

      <Card>
        <CardTitle>Informations</CardTitle>
        <CardDescription className="mt-2 mb-4">
          Modifie tes coordonnées.
        </CardDescription>
        <form onSubmit={onSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="admin-first">Prénom</Label>
              <Input
                id="admin-first"
                required
                value={formFirst}
                onChange={(e) => setFormFirst(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="admin-last">Nom</Label>
              <Input
                id="admin-last"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              disabled
              value={formEmail}
            />
          </div>
          <FieldError>{profileError ?? undefined}</FieldError>
          {profileDone && <p className="text-sm text-olive">{profileDone}</p>}
          <Button type="submit" disabled={profileSaving}>
            {profileSaving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      </Card>

      {/* Section: Apparence */}
      <Card>
        <CardTitle>Apparence</CardTitle>
        <CardDescription className="mt-2 mb-3">
          Personnalise l'affichage de l'application.
        </CardDescription>
        <div className="flex items-center justify-between rounded-lg border border-pierre/15 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-bordeaux dark:text-slate-200">Sons</p>
            <p className="text-xs text-pierre">Active ou désactive les effets sonores</p>
          </div>
          <SoundToggle />
        </div>
      </Card>

      {/* Section: Mot de passe */}
      <AdminPasswordChangeCard />

      {/* Section: Compte */}
      <Card>
        <CardTitle>Compte</CardTitle>
        <CardDescription className="mt-2 mb-3">
          Gère ton compte.
        </CardDescription>
        <Button variant="outline" onClick={onSignOut}>
          Se déconnecter
        </Button>
      </Card>
    </div>
  )
}

function AdminPasswordChangeCard() {
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (newPwd.length < 6) { setMsg('Minimum 6 caractères.'); setIsError(true); return }
    if (newPwd !== confirmPwd) { setMsg('Les mots de passe ne correspondent pas.'); setIsError(true); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      setMsg('Mot de passe modifié.')
      setIsError(false)
      setNewPwd('')
      setConfirmPwd('')
      toast('Mot de passe modifié.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erreur.')
      setIsError(true)
      toastError('Erreur.')
    } finally { setSaving(false) }
  }

  return (
    <Card>
      <CardTitle>Mot de passe</CardTitle>
      <CardDescription className="mt-2 mb-3">Modifie ton mot de passe.</CardDescription>
      <form onSubmit={handleChangePassword} className="space-y-3">
        <div>
          <Label htmlFor="admin-new-pwd">Nouveau mot de passe</Label>
          <div className="relative">
            <Input id="admin-new-pwd" type={showNew ? 'text' : 'password'} required minLength={6} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Minimum 6 caractères" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-pierre hover:text-bordeaux" tabIndex={-1}>{showNew ? '🙈' : '👁'}</button>
          </div>
        </div>
        <div>
          <Label htmlFor="admin-confirm-pwd">Confirmer</Label>
          <Input id="admin-confirm-pwd" type={showNew ? 'text' : 'password'} required minLength={6} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Retape" />
        </div>
        {msg && <p className={`text-sm ${isError ? 'text-red-600' : 'text-olive'}`}>{msg}</p>}
        <Button type="submit" disabled={saving}>{saving ? 'Modification…' : 'Modifier'}</Button>
      </form>
    </Card>
  )
}
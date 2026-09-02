import { FormEvent, useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/AvatarUpload'
import { Badge } from '@/components/Badge'
import { SoundToggle } from '@/components/SoundToggle'
import { BulletinPDF } from '@/components/BulletinPDF'
import { supabase } from '@/lib/supabase'
import { toast, toastError } from '@/components/ui/Toast'
import { getBilanPreferences, saveBilanPreferences } from '@/lib/gamification'

const BILAN_DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MAX_BILAN_DAYS = 3

interface Profile {
  id: string
  avatar_url?: string | null
  first_name?: string | null
  last_name?: string | null
  class_id?: string | null
  active_badge?: string | null
}

interface SettingsTabProps {
  profile: Profile
  earnedBadges: string[]
  badgeBusy: boolean
  formFirst: string
  formName: string
  formPhone: string
  formTribe: string
  formDept: string
  setFormFirst: (v: string) => void
  setFormName: (v: string) => void
  setFormPhone: (v: string) => void
  setFormTribe: (v: string) => void
  setFormDept: (v: string) => void
  profileSaving: boolean
  profileError: string | null
  profileDone: string | null
  onSaveProfile: (e: FormEvent) => void
  onSelectBadge: (type: string) => void
  onSignOut: () => void
  onAvatarSaved?: (url: string | null) => void
}

export function SettingsTab({
  profile,
  earnedBadges,
  badgeBusy,
  formFirst,
  formName,
  formPhone,
  formTribe,
  formDept,
  setFormFirst,
  setFormName,
  setFormPhone,
  setFormTribe,
  setFormDept,
  profileSaving,
  profileError,
  profileDone,
  onSaveProfile,
  onSelectBadge,
  onSignOut,
  onAvatarSaved,
}: SettingsTabProps) {
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
          badgeType={profile.active_badge ?? null}
          onSaved={(url) => onAvatarSaved?.(url)}
        />
      </Card>

      <Card>
        <CardTitle>Informations</CardTitle>
        <CardDescription className="mt-2 mb-4">
          Modifie tes coordonnées pour le suivi de la session.
        </CardDescription>
        <form onSubmit={onSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="set-first">Prénom</Label>
              <Input
                id="set-first"
                required
                value={formFirst}
                onChange={(e) => setFormFirst(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="set-last">Nom</Label>
              <Input
                id="set-last"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="set-phone">Téléphone</Label>
            <Input
              id="set-phone"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="set-tribe">Tribu</Label>
              <select
                id="set-tribe"
                value={formTribe}
                onChange={(e) => setFormTribe(e.target.value)}
                className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
              >
                <option value="">—</option>
                {['Ruben', 'Siméon', 'Lévi', 'Juda', 'Zabulon', 'Issacar', 'Dan', 'Gad', 'Aser', 'Nephtali', 'Joseph', 'Benjamin', 'Aucune'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="set-dept">Département</Label>
              <select
                id="set-dept"
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
              >
                <option value="">—</option>
                {['ACCUEIL', 'ADMINISTRATION', 'ADN', "ACADÉMIE D'HONNEUR", 'BAPTÊME', 'BLOOM', 'CHANTRES', 'COMMUNICATION', 'COMPTABILITÉ', 'DÉCORATION', 'DIGITAL', "ENFANT D'HONNEUR", 'ELEEO', 'GDC', 'INTERCESSION', 'LOGE PASTORALE', 'LEAMANS', "MÉDECINE D'HONNEUR", 'MOYENS GÉNÉRAUX', 'MRES', "PLUME D'HONNEUR", 'PROTOCOLE', "COEUR D'HONNEUR", 'SAINTE CÈNE', 'EVANGÉLISATION', 'AUCUN'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-md border border-sable/60 bg-white/60 px-3 py-2 text-sm">
            <span className="text-pierre">Classe : </span>
            <span className="font-display font-semibold text-bordeaux">
              {profile.class_id ? 'Assigné' : 'Non assignée'}
            </span>
          </div>
          <FieldError>{profileError ?? undefined}</FieldError>
          {profileDone && <p className="text-sm text-olive">{profileDone}</p>}
          <Button type="submit" disabled={profileSaving}>
            {profileSaving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      </Card>

      {/* Section: Badge actif */}
      <Card>
        <CardTitle>Badge actif</CardTitle>
        <CardDescription className="mt-2 mb-3">
          Choisis le badge qui s'affiche sur ton avatar.
        </CardDescription>
        {earnedBadges.length === 0 ? (
          <p className="text-sm text-pierre">Aucun badge obtenu pour le moment.</p>
        ) : (
          <div className="flex flex-wrap items-start gap-3">
            {earnedBadges.map((key) => (
              <button
                key={key}
                type="button"
                disabled={badgeBusy}
                onClick={() => onSelectBadge(key)}
                aria-pressed={profile.active_badge === key}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-card border p-2 transition-colors disabled:cursor-wait ${
                  profile.active_badge === key
                    ? 'border-or bg-or/10'
                    : 'border-pierre/15 hover:border-or/50'
                }`}
              >
                <Badge type={key} size={44} />
                {profile.active_badge === key && (
                  <span className="rounded-full bg-bordeaux px-2 py-0.5 font-mono text-[10px] text-parchemin">
                    Actif
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Section: Mes jours de bilan */}
      <BilanDayPicker studentId={profile.id} />

      {/* Section: Mot de passe */}
      <PasswordChangeCard />

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

      {/* Section: Compte */}
      <Card>
        <CardTitle>Compte</CardTitle>
        <CardDescription className="mt-2 mb-3">
          Gère ton compte et tes données.
        </CardDescription>
        <div className="flex flex-wrap gap-2">
          <BulletinPDF studentId={profile.id} />
          <Button variant="outline" onClick={onSignOut}>
            Se déconnecter
          </Button>
        </div>
      </Card>
    </div>
  )
}

function PasswordChangeCard() {
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    setIsError(false)

    if (newPwd.length < 6) {
      setMsg('Le mot de passe doit contenir au moins 6 caractères.')
      setIsError(true)
      return
    }
    if (newPwd !== confirmPwd) {
      setMsg('Les mots de passe ne correspondent pas.')
      setIsError(true)
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      setMsg('Mot de passe modifié avec succès.')
      setIsError(false)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      toast('Mot de passe modifié.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erreur lors de la modification du mot de passe.')
      setIsError(true)
      toastError('Erreur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardTitle>Mot de passe</CardTitle>
      <CardDescription className="mt-2 mb-3">
        Modifie ton mot de passe de connexion.
      </CardDescription>
      <form onSubmit={handleChangePassword} className="space-y-3">
        <div>
          <Label htmlFor="new-pwd">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="new-pwd"
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Minimum 6 caractères"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-pierre hover:text-bordeaux"
              tabIndex={-1}
            >
              {showNew ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirm-pwd">Confirmer le mot de passe</Label>
          <Input
            id="confirm-pwd"
            type={showNew ? 'text' : 'password'}
            required
            minLength={6}
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Retape le mot de passe"
          />
        </div>
        {msg && <p className={`text-sm ${isError ? 'text-red-600' : 'text-olive'}`}>{msg}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? 'Modification…' : 'Modifier le mot de passe'}
        </Button>
      </form>
    </Card>
  )
}

function BilanDayPicker({ studentId }: { studentId: string }) {
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 4, 6])
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getBilanPreferences(studentId)
      .then((prefs) => {
        if (!cancelled && prefs?.bilan_days) {
          setSelectedDays(prefs.bilan_days as number[])
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [studentId])

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day)
      if (prev.length >= MAX_BILAN_DAYS) return prev
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveBilanPreferences(studentId, selectedDays)
      toast('Jours de bilan enregistrés.')
    } catch {
      toastError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <Card>
      <CardTitle>Mes jours de bilan</CardTitle>
      <CardDescription className="mt-1 mb-3">
        Choisis jusqu'à {MAX_BILAN_DAYS} jours de la semaine pour remplir ton bilan.
      </CardDescription>
      <div className="flex flex-wrap gap-2 mb-3">
        {BILAN_DAY_LABELS.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggleDay(i)}
            disabled={!selectedDays.includes(i) && selectedDays.length >= MAX_BILAN_DAYS}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              selectedDays.includes(i)
                ? 'bg-bordeaux text-parchemin'
                : 'border border-pierre/20 text-pierre hover:border-or/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-pierre">
        {selectedDays.length}/{MAX_BILAN_DAYS} jours sélectionnés
      </p>
      <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </Card>
  )
}
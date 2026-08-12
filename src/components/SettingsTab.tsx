import { FormEvent } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/AvatarUpload'
import { Badge } from '@/components/Badge'
import { SoundToggle } from '@/components/SoundToggle'
import { BulletinPDF } from '@/components/BulletinPDF'
import { isBadgeKey, BADGES } from '@/lib/badges'

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
          onSaved={() => {}}
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
              <Input
                id="set-tribe"
                value={formTribe}
                onChange={(e) => setFormTribe(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="set-dept">Département</Label>
              <Input
                id="set-dept"
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
              />
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

import { FormEvent, useState, useEffect, useRef } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast, toastError } from '@/components/ui/Toast'
import { saveWeeklyBilan } from '@/lib/gamification'
import { sendBilanToGoogleSheets } from '@/lib/googleSheets'
import type { WeeklyBilan } from '@/lib/types'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function formatMissingDays(days: number[]): string {
  if (days.length === 0) return ''
  const names = days.map((d) => DAY_NAMES[d])
  if (names.length === 1) return `${names[0]} n'a pas été rempli`
  if (names.length === 2) return `${names[0]} et ${names[1]} n'ont pas été remplis`
  return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]} n'ont pas été remplis`
}

interface BilanPopupProps {
  studentId: string
  studentName: string
  weekNumber: number
  currentBilanDay: number
  missingDays: number[]
  existingBilan?: WeeklyBilan | null
  onClose: () => void
}

export default function BilanPopup({
  studentId,
  studentName,
  weekNumber,
  currentBilanDay,
  missingDays,
  existingBilan,
  onClose,
}: BilanPopupProps) {
  const [resumeDone, setResumeDone] = useState(existingBilan?.resume_done ?? false)
  const [meditationStatus, setMeditationStatus] = useState<'all_days' | 'some_days' | 'none'>(existingBilan?.meditation_status ?? 'none')
  const [meditationDays, setMeditationDays] = useState(existingBilan?.meditation_days ?? 0)
  const [evangelisationStatus, setEvangelisationStatus] = useState<'soul_won' | 'evangelized_no_soul' | 'none'>(existingBilan?.evangelisation_status ?? 'none')
  const [contactName, setContactName] = useState(existingBilan?.contact_name ?? '')
  const [contactPhone, setContactPhone] = useState(existingBilan?.contact_phone ?? '')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (submitted) {
      timerRef.current = setTimeout(onClose, 2000)
      return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }
  }, [submitted, onClose])

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <Card className="w-full max-w-md text-center">
          <div className="mb-3 text-4xl">✅</div>
          <CardTitle>Bilan enregistré !</CardTitle>
          <CardDescription className="mt-2">
            Merci {studentName}, ton bilan de la semaine {weekNumber} a bien été enregistré.
          </CardDescription>
        </Card>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const bilanData = {
        student_id: studentId,
        week_number: weekNumber,
        resume_done: resumeDone,
        meditation_status: meditationStatus,
        meditation_days: meditationStatus === 'some_days' ? meditationDays : meditationStatus === 'all_days' ? 7 : 0,
        evangelisation_status: evangelisationStatus,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        bilan_day: currentBilanDay,
      }
      await saveWeeklyBilan(bilanData)
      sendBilanToGoogleSheets({
        student_name: studentName,
        week_number: weekNumber,
        resume_done: resumeDone,
        meditation_status: meditationStatus,
        meditation_days: bilanData.meditation_days,
        evangelisation_status: evangelisationStatus,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        bilan_day: currentBilanDay,
      }).catch(() => {})
      toast('Bilan enregistré.')
      setSubmitted(true)
    } catch {
      toastError('Erreur lors de la sauvegarde du bilan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardTitle>Ton Bilan de la Semaine</CardTitle>
        <CardDescription className="mt-1 mb-4">
          {missingDays.length > 0
            ? `${formatMissingDays(missingDays)}. Complète ton bilan ci-dessous.`
            : `Bilan de la semaine ${weekNumber}.`}
        </CardDescription>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-pierre/15 bg-white/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-bordeaux">Résumé</p>
            <p className="mt-1 text-sm text-pierre">As-tu fait tes résumés cette semaine ?</p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant={resumeDone ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setResumeDone(true)}
              >
                Oui
              </Button>
              <Button
                type="button"
                variant={!resumeDone ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setResumeDone(false)}
              >
                Non
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-pierre/15 bg-white/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-bordeaux">Méditation</p>
            <p className="mt-1 text-sm text-pierre">As-tu médité sur la Parole cette semaine ?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                ['all_days', 'Tous les jours'],
                ['some_days', 'Certains jours'],
                ['none', 'Pas du tout'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={meditationStatus === value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setMeditationStatus(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {meditationStatus === 'some_days' && (
              <div className="mt-2">
                <label className="text-xs text-pierre">Combien de jours ?</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={meditationDays}
                  onChange={(e) => setMeditationDays(Number(e.target.value))}
                  className="mt-1 w-20 rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                />
              </div>
            )}
          </div>

          <div className="rounded-md border border-pierre/15 bg-white/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-bordeaux">Évangélisation</p>
            <p className="mt-1 text-sm text-pierre">As-tu partagé l'Évangile cette semaine ?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                ['soul_won', 'Une âme gagnée'],
                ['evangelized_no_soul', 'Évangélisé, pas d\'âme gagnée'],
                ['none', 'Pas cette semaine'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={evangelisationStatus === value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setEvangelisationStatus(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {evangelisationStatus === 'soul_won' && (
              <div className="mt-2 space-y-2">
                <div>
                  <label className="text-xs text-pierre">Nom du contact</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nom complet"
                    className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-pierre">Téléphone du contact</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Numéro"
                    className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Enregistrement…' : 'Enregistrer mon bilan'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

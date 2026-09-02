import { useState, useEffect, useCallback } from 'react'
import { getSoulTracking, upsertSoulTracking, getSoulEntries, addSoulEntry, type SoulTracking, type SoulEntry } from '@/lib/courses'

interface Props {
  studentId: string
  studentName: string
}

const CATEGORIES = [
  { key: 'assiduite' as const, label: 'Assiduité', icon: '📋' },
  { key: 'meditation' as const, label: 'Méditation', icon: '📖' },
  { key: 'social' as const, label: 'Situation sociale', icon: '🏠' },
  { key: 'general' as const, label: 'Général', icon: '📝' },
]

export function SoulTrackingTab({ studentId, studentName }: Props) {
  const [tracking, setTracking] = useState<SoulTracking | null>(null)
  const [entries, setEntries] = useState<SoulEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Form fields
  const [attendanceNotes, setAttendanceNotes] = useState('')
  const [attendanceRating, setAttendanceRating] = useState<number | null>(null)
  const [meditationObs, setMeditationObs] = useState('')
  const [socialContext, setSocialContext] = useState('')

  // New entry
  const [newCategory, setNewCategory] = useState<SoulEntry['category']>('general')
  const [newContent, setNewContent] = useState('')
  const [addingEntry, setAddingEntry] = useState(false)

  const load = useCallback(async () => {
    try {
      const t = await getSoulTracking(studentId)
      setTracking(t)
      if (t) {
        setAttendanceNotes(t.attendance_notes ?? '')
        setAttendanceRating(t.attendance_rating)
        setMeditationObs(t.meditation_observations ?? '')
        setSocialContext(t.social_context ?? '')
        const e = await getSoulEntries(t.id)
        setEntries(e)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const updated = await upsertSoulTracking(studentId, {
        attendance_notes: attendanceNotes || null,
        attendance_rating: attendanceRating,
        meditation_observations: meditationObs || null,
        social_context: socialContext || null,
      })
      setTracking(updated)
      setAttendanceNotes('')
      setAttendanceRating(3)
      setMeditationObs('')
      setSocialContext('')
      setMsg('Fiche enregistrée et champs réinitialisés.')
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleAddEntry = async () => {
    if (!tracking || !newContent.trim()) return
    setAddingEntry(true)
    try {
      const entry = await addSoulEntry(tracking.id, newCategory, newContent.trim())
      setEntries(prev => [entry, ...prev])
      setNewContent('')
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setAddingEntry(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-3"><div className="h-20 rounded-card bg-pierre/10" /><div className="h-32 rounded-card bg-pierre/10" /></div>
  }

  const input = "w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
  const label = "mb-1 block text-sm font-medium text-bordeaux"

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg text-bordeaux">Fiche de suivi d'âme</h3>
        <p className="text-sm text-pierre">Suivi pastoral privé pour {studentName} — visible uniquement par toi et l'admin.</p>
      </div>

      {/* Assiduité */}
      <div className="rounded-card border border-pierre/15 bg-white p-4">
        <h4 className="font-display text-base text-bordeaux">Assiduité</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Note (1-5)</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setAttendanceRating(n)}
                  className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${attendanceRating === n ? 'bg-or text-white' : 'bg-pierre/10 text-pierre hover:bg-or/20'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label}>Observations</label>
            <textarea className={input} rows={2} value={attendanceNotes} onChange={e => setAttendanceNotes(e.target.value)} placeholder="Régularité, ponctualité..." />
          </div>
        </div>
      </div>

      {/* Méditation */}
      <div className="rounded-card border border-pierre/15 bg-white p-4">
        <h4 className="font-display text-base text-bordeaux">Contrôle de méditation</h4>
        <textarea className={input + " mt-3"} rows={3} value={meditationObs} onChange={e => setMeditationObs(e.target.value)} placeholder="Observations qualitatives sur la vie spirituelle..." />
      </div>

      {/* Situation sociale */}
      <div className="rounded-card border border-pierre/15 bg-white p-4">
        <h4 className="font-display text-base text-bordeaux">Situation sociale</h4>
        <textarea className={input + " mt-3"} rows={3} value={socialContext} onChange={e => setSocialContext(e.target.value)} placeholder="Contexte de vie, famille, travail, difficultés..." />
      </div>

      <button onClick={handleSave} disabled={saving} className="rounded-md bg-bordeaux px-4 py-2 text-sm font-medium text-parchemin hover:bg-teal-dark disabled:opacity-50">
        {saving ? 'Enregistrement...' : 'Enregistrer la fiche'}
      </button>
      {msg && <p className="text-sm text-olive">{msg}</p>}

      {/* Journal chronologique */}
      <div className="rounded-card border border-pierre/15 bg-white p-4">
        <h4 className="font-display text-base text-bordeaux">Journal de suivi</h4>

        <div className="mt-3 flex gap-2">
          <select value={newCategory} onChange={e => { setNewContent(''); setNewCategory(e.target.value as SoulEntry['category']) }}
            className="w-40 rounded-md border border-pierre/30 bg-white px-2 py-1.5 text-sm text-bordeaux">
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
          </select>
          <input className={input + " flex-1"} value={newContent} onChange={e => setNewContent(e.target.value)}
            placeholder={`Observation (${CATEGORIES.find(c => c.key === newCategory)?.label})...`}
            onKeyDown={e => e.key === 'Enter' && handleAddEntry()} />
          <button onClick={handleAddEntry} disabled={addingEntry || !newContent.trim()}
            className="shrink-0 rounded-md bg-or px-3 py-1.5 text-sm font-medium text-white hover:bg-or-light disabled:opacity-50">
            + Ajouter
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="mt-3 text-sm text-pierre">Aucune observation pour le moment.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {entries.map(entry => {
              const cat = CATEGORIES.find(c => c.key === entry.category)
              return (
                <div key={entry.id} className="rounded-md border border-pierre/10 bg-parchemin p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat?.icon}</span>
                    <span className="text-xs font-medium text-bordeaux">{cat?.label}</span>
                    <span className="ml-auto font-mono text-[10px] text-pierre">
                      {new Date(entry.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-pierre">{entry.content}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

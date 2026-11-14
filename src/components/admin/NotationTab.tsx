import { useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { toast, toastError } from '@/components/ui/Toast'
import { sendPushNotification } from '@/lib/pushSend'
import { playSuccess } from '@/lib/sound'
import {
  getSubmissionsForGrading,
  gradeSubmission,
  getResumesForGrading,
  gradeResume,
  ResumeForGrading,
  Submission,
} from '@/lib/courses'

export function NotationTab({ onGraded }: { onGraded: () => void }) {
  const [items, setItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resumes, setResumes] = useState<ResumeForGrading[]>([])
  const [rGrades, setRGrades] = useState<Record<string, string>>({})
  const [rFeedbacks, setRFeedbacks] = useState<Record<string, string>>({})
  const [rSavingId, setRSavingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getSubmissionsForGrading(), getResumesForGrading()])
      .then(([data, rdata]) => {
        setItems(data)
        const g: Record<string, string> = {}
        const f: Record<string, string> = {}
        for (const s of data) {
          if (s.grade !== null && s.grade !== undefined) g[s.id] = String(s.grade)
          f[s.id] = s.feedback ?? ''
        }
        setGrades(g)
        setFeedbacks(f)
        setResumes(rdata)
        const rg: Record<string, string> = {}
        const rf: Record<string, string> = {}
        for (const r of rdata) {
          if (r.grade !== null && r.grade !== undefined) rg[r.id] = String(r.grade)
          rf[r.id] = r.feedback ?? ''
        }
        setRGrades(rg)
        setRFeedbacks(rf)
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleGrade(sub: Submission) {
    const raw = grades[sub.id]?.trim()
    const grade = raw === '' ? null : Number(raw)
    if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 20)) {
      setMessage('La note doit être entre 0 et 20.'); return
    }
    setSavingId(sub.id); setMessage(null)
    try {
      await gradeSubmission(sub.id, grade, feedbacks[sub.id]?.trim() ?? '')
      setItems((prev) => prev.map((s) => s.id === sub.id ? { ...s, grade, feedback: feedbacks[sub.id]?.trim() ?? '' } : s))
      setMessage('Note enregistrée.'); playSuccess(); toast('Note enregistrée.'); onGraded()
      sendPushNotification({ userId: sub.student_id, title: 'Devoir corrigé', body: `Ton devoir "${sub.assignment?.description || 'Devoir'}" a été corrigé.`, tag: 'grade' }).catch(() => {})
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Erreur.'); toastError('Erreur.') } finally { setSavingId(null) }
  }

  async function handleGradeResume(r: ResumeForGrading) {
    const raw = rGrades[r.id]?.trim()
    const grade = raw === '' ? null : Number(raw)
    if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 20)) {
      setMessage('La note doit être entre 0 et 20.'); return
    }
    setRSavingId(r.id); setMessage(null)
    try {
      await gradeResume(r.id, grade, rFeedbacks[r.id]?.trim() ?? '')
      setResumes((prev) => prev.map((x) => x.id === r.id ? { ...x, grade, feedback: rFeedbacks[r.id]?.trim() ?? '' } : x))
      setMessage('Correction enregistrée.'); playSuccess(); toast('Correction enregistrée.'); onGraded()
      sendPushNotification({ userId: r.student_id, title: 'Fiche de révision corrigée', body: 'Ta fiche de révision a été corrigée.', tag: 'resume-graded' }).catch(() => {})
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Erreur.'); toastError('Erreur.') } finally { setRSavingId(null) }
  }

  if (loading) return <Card><CardDescription>Chargement…</CardDescription></Card>

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Notation des rendus</CardTitle>
        <CardDescription className="mt-1 mb-3">Note les devoirs, exercices et notes manuscrites des étudiants.</CardDescription>
        {items.length === 0 ? <p className="text-sm text-pierre">Aucun rendu à noter.</p> : (
          <ul className="space-y-4">
            {items.map((sub) => (
              <li key={sub.id} className="rounded-card border border-pierre/15 p-4">
                <p className="text-sm font-medium text-bordeaux">{sub.student?.first_name} {sub.student?.last_name}</p>
                <p className="mt-0.5 text-xs text-pierre">{sub.type === 'notes' ? `Notes manuscrites — Semaine ${sub.course?.week ?? '?'} — ${sub.course?.title ?? ''}` : `${sub.assignment?.type === 'DEVOIR' ? 'Devoir' : 'Exercice'} — ${sub.assignment?.description ?? '—'}`}</p>
                {sub.content && <p className="mt-2 rounded-md bg-white/60 px-3 py-2 text-sm text-pierre">{sub.content}</p>}
                {sub.type === 'notes' && sub.attachments && sub.attachments.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">{sub.attachments.map((url, i) => <a key={i} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-sable/70"><img src={url} alt="Note" className="h-24 w-32 object-cover" /></a>)}</div>
                ) : sub.file_url && <a href={sub.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-bordeaux underline">Pièce jointe</a>}
                <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
                  <div><Label>Note /20</Label><Input type="number" min={0} max={20} value={grades[sub.id] ?? ''} onChange={(e) => setGrades((p) => ({ ...p, [sub.id]: e.target.value }))} /></div>
                  <div><Label>Appréciation</Label><Input value={feedbacks[sub.id] ?? ''} placeholder="Encouragement…" onChange={(e) => setFeedbacks((p) => ({ ...p, [sub.id]: e.target.value }))} /></div>
                </div>
                <Button variant="outline" className="mt-3 !px-3 !py-1.5 text-xs" disabled={savingId === sub.id} onClick={() => handleGrade(sub)}>{savingId === sub.id ? '…' : 'Enregistrer'}</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardTitle>Correction des résumés</CardTitle>
        {resumes.length === 0 ? <p className="text-sm text-pierre">Aucun résumé à corriger.</p> : (
          <ul className="space-y-4">
            {resumes.map((r) => (
              <li key={r.id} className="rounded-card border border-pierre/15 p-4">
                <p className="text-sm font-medium text-bordeaux">{r.student?.first_name} {r.student?.last_name}</p>
                <p className="text-xs text-pierre">Semaine {r.course?.week ?? '?'} — {r.course?.title ?? ''}</p>
                <p className="mt-2 rounded-md bg-white/60 px-3 py-2 text-sm text-pierre">{r.content}</p>
                {r.file_url && r.file_name && (
                  <div className="mt-2">
                    {/\.(png|jpe?g|gif|webp|bmp)$/i.test(r.file_name) ? (
                      <a href={r.file_url} target="_blank" rel="noreferrer">
                        <img src={r.file_url} alt="Résumé joint" className="h-24 w-32 rounded object-cover" />
                      </a>
                    ) : (
                      <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs text-bordeaux underline break-all">
                        Pièce jointe : {r.file_name}
                      </a>
                    )}
                  </div>
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
                  <div><Label>Note /20</Label><Input type="number" min={0} max={20} value={rGrades[r.id] ?? ''} onChange={(e) => setRGrades((p) => ({ ...p, [r.id]: e.target.value }))} /></div>
                  <div><Label>Appréciation</Label><Input value={rFeedbacks[r.id] ?? ''} placeholder="Encouragement…" onChange={(e) => setRFeedbacks((p) => ({ ...p, [r.id]: e.target.value }))} /></div>
                </div>
                <Button variant="outline" className="mt-3 !px-3 !py-1.5 text-xs" disabled={rSavingId === r.id} onClick={() => handleGradeResume(r)}>{rSavingId === r.id ? '…' : 'Enregistrer'}</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {message && <p className="text-sm text-olive">{message}</p>}
    </div>
  )
}

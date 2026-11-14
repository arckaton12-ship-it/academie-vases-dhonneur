import { FormEvent, useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { FieldError } from '@/components/ui/Input'
import { toast, toastError } from '@/components/ui/Toast'
import { QuizTab } from '@/components/QuizTab'
import { sendPushToRole } from '@/lib/pushSend'
import type { AudioPart } from '@/lib/types'
import {
  createCourse,
  updateCourse,
  deleteCourse,
  saveCourseMiseEnPratique,
  saveCourseAudioParts,
  uploadCourseFile,
  uploadCourseAudio,
  getMiniTask,
  saveMiniTask,
  ClassRow,
  Course,
} from '@/lib/courses'

export function CoursTab({
  classes,
  courses,
  onRefresh,
}: {
  classes: ClassRow[]
  courses: Course[]
  onRefresh: () => void
}) {
  const [editingId, setEditingId] = useState('')
  const [classId, setClassId] = useState('')
  const [week, setWeek] = useState('1')
  const [sessionDate, setSessionDate] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [audioParts, setAudioParts] = useState<AudioPart[]>([])
  const [miniTask, setMiniTask] = useState('')
  const [miseEnPratique, setMiseEnPratique] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(classes[0].id)
  }, [classes, classId])

  useEffect(() => {
    if (!editingId) return
    const course = courses.find((c) => c.id === editingId)
    if (!course) return
    setClassId(course.class_id ?? '')
    setWeek(String(course.week))
    setSessionDate(course.session_date ?? '')
    setTitle(course.title)
    setDescription(course.description ?? '')
    setAudioFile(null)
    setVideoFile(null)
    setAudioUrl(course.audio_url ?? '')
    setVideoUrl(course.video_url ?? '')
    setAudioParts(
      Array.isArray(course.audio_parts) && (course.audio_parts as unknown[]).length > 0
        ? (course.audio_parts as AudioPart[])
        : []
    )
    setMiseEnPratique(course.mise_en_pratique ?? '')
    getMiniTask(editingId).then((t) => setMiniTask(t?.instruction ?? '')).catch(() => setMiniTask(''))
  }, [editingId, courses])

  function resetForm() {
    setEditingId('')
    setClassId(classes[0]?.id ?? '')
    setWeek('1')
    setSessionDate('')
    setTitle('')
    setDescription('')
    setAudioFile(null)
    setVideoFile(null)
    setAudioUrl('')
    setVideoUrl('')
    setAudioParts([])
    setMiniTask('')
    setMiseEnPratique('')
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    console.log('[CoursTab] submit', { classId, title, week, audioFile, videoFile })
    if (!classId || !title.trim()) {
      setError('La classe et le titre sont obligatoires.')
      toastError('La classe et le titre sont obligatoires.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      if (editingId) {
        const audioUploadedUrl = audioFile ? await uploadCourseAudio(audioFile, editingId) : undefined
        const videoPath = videoFile ? await uploadCourseFile(videoFile) : undefined
        await updateCourse(editingId, {
          classId,
          title: title.trim(),
          week: Number(week) || 1,
          sessionDate: sessionDate || undefined,
          description: description.trim() || undefined,
          ...(videoPath !== undefined ? { videoPath } : {}),
          audioUrl: audioUploadedUrl || audioUrl.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          audioParts: audioParts.map((p) => ({ nom: p.nom, audio: p.audio, video: p.video ?? null })),
        })
        await saveCourseMiseEnPratique(editingId, miseEnPratique.trim())
        await saveMiniTask(editingId, miniTask)
        setSuccess('Cours modifié.')
        toast('Cours modifié.')
      } else {
        const videoPath = videoFile ? await uploadCourseFile(videoFile) : undefined
        const created = await createCourse({
          classId,
          title: title.trim(),
          week: Number(week) || 1,
          sessionDate: sessionDate || undefined,
          description: description.trim() || undefined,
          videoPath,
          videoUrl: videoUrl.trim() || undefined,
          audioUrl: audioUrl.trim() || undefined,
        })
        if (audioFile) {
          const uploadedAudioUrl = await uploadCourseAudio(audioFile, created.id)
          await updateCourse(created.id, { audioUrl: uploadedAudioUrl })
        }
        if (audioParts.length > 0) {
          await saveCourseAudioParts(created.id, audioParts.map((p) => ({ nom: p.nom, audio: p.audio, video: p.video ?? null })))
        }
        await saveCourseMiseEnPratique(created.id, miseEnPratique.trim())
        setSuccess('Cours publié.')
        toast('Cours publié.')
        sendPushToRole('student', 'Nouveau cours disponible', title.trim(), 'new-course').catch(() => {})
      }
      onRefresh()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
      toastError('Erreur.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editingId) return
    if (!window.confirm('Supprimer ce cours définitivement ?')) return
    setLoading(true)
    try {
      await deleteCourse(editingId)
      setSuccess('Cours supprimé.')
      toast('Cours supprimé.')
      onRefresh()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
      toastError('Erreur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>{editingId ? 'Modifier un cours' : 'Créer un cours'}</CardTitle>
        <CardDescription className="mt-1 mb-4">
          Gère les cours de chaque classe : titre, semaine, média (lien OU upload), mini-tâche.
        </CardDescription>

        <div className="mb-4">
          <Label htmlFor="admin-course-pick">Cours existant</Label>
          <select
            id="admin-course-pick"
            value={editingId}
            onChange={(e) => (e.target.value ? setEditingId(e.target.value) : resetForm())}
            className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
          >
            <option value="">— Nouveau cours —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>Semaine {c.week} — {c.title}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-course-class">Classe</Label>
            <select
              id="admin-course-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="admin-course-week">Semaine</Label>
              <Input id="admin-course-week" type="number" min={1} value={week} onChange={(e) => setWeek(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="admin-course-date">Date</Label>
              <Input id="admin-course-date" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="admin-course-title">Titre</Label>
            <Input id="admin-course-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. La foi qui agit" />
          </div>

          <div>
            <Label htmlFor="admin-course-desc">Description</Label>
            <textarea id="admin-course-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Résumé ou thème…" className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Vidéo</Label>
              <Input value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); setVideoFile(null) }} placeholder="Lien YouTube (optionnel)" />
              <input type="file" accept="video/*" onChange={(e) => { setVideoFile(e.target.files?.[0] ?? null); setVideoUrl('') }} className="mt-2 block w-full text-sm text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-bordeaux file:px-3 file:py-1.5 file:text-sm file:text-parchemin" />
              <p className="mt-1 text-[11px] text-pierre italic">Les fichiers uploadés consomment la bande passante Supabase. Préfère un lien YouTube.</p>
            </div>
            <div>
              <Label>Audio du cours</Label>
              <p className="mb-1.5 text-xs text-pierre">Fichier MP3 ou lien Google Drive (optionnel).</p>
              <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" onChange={(e) => { setAudioFile(e.target.files?.[0] ?? null); setAudioUrl('') }} className="block w-full text-sm text-pierre file:mr-3 file:rounded-md file:border-0 file:bg-or file:px-4 file:py-2 file:text-sm file:font-medium file:text-encre hover:file:bg-or/80" />
              {audioFile && <p className="mt-1.5 text-xs text-olive">Fichier selectionne : {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} Mo)</p>}
              <p className="mt-2 mb-1 text-[11px] text-pierre italic">— ou colle un lien —</p>
              <Input value={audioUrl} onChange={(e) => { setAudioUrl(e.target.value); setAudioFile(null) }} placeholder="Lien Google Drive ou URL directe (optionnel)" />
              {editingId && !audioFile && audioUrl && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-olive">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-olive" /> Audio actuel charge
                </p>
              )}
            </div>
          </div>

          <div className="rounded-md border border-or/40 bg-parchemin p-3">
            <Label>Parties audio du cours</Label>
            <p className="mb-2 text-xs text-pierre">
              Si le cours a plusieurs fichiers audio (ex. « Partie 1 », « Partie 2 »…), renseigne-les ici. C'est ce que les étudiants écoutent réellement sur la page du cours.
            </p>
            {audioParts.map((part, i) => (
              <div key={`part-${i}`} className="mb-2 grid grid-cols-1 gap-1.5 rounded-md border border-pierre/20 bg-white p-2 sm:grid-cols-[1fr_1.4fr_1.4fr_auto] sm:gap-2">
                <Input
                  value={part.nom}
                  placeholder="Nom (ex. Partie 1)"
                  onChange={(e) => {
                    const next = [...audioParts]
                    next[i] = { ...part, nom: e.target.value }
                    setAudioParts(next)
                  }}
                />
                <Input
                  value={part.audio ?? ''}
                  placeholder="Lien audio (Drive / URL)"
                  onChange={(e) => {
                    const next = [...audioParts]
                    next[i] = { ...part, audio: e.target.value }
                    setAudioParts(next)
                  }}
                />
                <Input
                  value={part.video ?? ''}
                  placeholder="Lien vidéo (optionnel)"
                  onChange={(e) => {
                    const next = [...audioParts]
                    next[i] = { ...part, video: e.target.value }
                    setAudioParts(next)
                  }}
                />
                <button
                  type="button"
                  onClick={() => setAudioParts(audioParts.filter((_, j) => j !== i))}
                  className="self-center rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Retirer
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAudioParts([...audioParts, { nom: '', audio: '', video: null }])}
              className="rounded-md border border-or/60 px-3 py-1.5 text-xs font-medium text-bordeaux hover:bg-or/10"
            >
              + Ajouter une partie
            </button>
            <p className="mt-1.5 text-[11px] text-pierre italic">Laisse vide pour ne pas écraser les parties existantes.</p>
          </div>

          <div className="rounded-md border border-or/40 bg-parchemin p-3">
            <Label htmlFor="admin-course-mt">Mini-tâche pratique</Label>
            <textarea id="admin-course-mt" rows={2} value={miniTask} onChange={(e) => setMiniTask(e.target.value)} placeholder="La tâche que l'étudiant devra réaliser…" className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" />
          </div>

          <div className="rounded-md border border-or/40 bg-parchemin p-3">
            <Label htmlFor="admin-course-mep">Mise en pratique du cours</Label>
            <textarea id="admin-course-mep" rows={3} value={miseEnPratique} onChange={(e) => setMiseEnPratique(e.target.value)} placeholder="Exercice / application concrète que l'étudiant verra sur la page du cours…" className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" />
          </div>

          <FieldError>{error ?? undefined}</FieldError>
          {success && <p className="text-sm text-olive">{success}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Enregistrement…' : editingId ? 'Modifier' : 'Publier'}</Button>
            {editingId && <Button type="button" variant="ghost" className="text-red-700" onClick={handleDelete}>Supprimer</Button>}
          </div>
        </form>
      </Card>

      <QuizTab courses={courses} />
    </div>
  )
}

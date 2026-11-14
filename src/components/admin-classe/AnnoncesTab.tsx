import { FormEvent, useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { getAnnouncements, createAnnouncement, deleteAnnouncement, updateAnnouncement, ClassRow, Announcement } from '@/lib/courses'
import { sendPushToRole } from '@/lib/pushSend'
import { playSuccess } from '@/lib/sound'
import { toast, toastError } from '@/components/ui/Toast'
import { formatShortDate } from './dates'

export function AnnoncesTab({
  classes,
  ownClassIds,
}: {
  classes: ClassRow[]
  ownClassIds: string[]
}) {
  const [annonces, setAnnonces] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const manageableClasses = ownClassIds.length > 0
    ? classes.filter((c) => ownClassIds.includes(c.id))
    : []

  useEffect(() => {
    if (!classId && manageableClasses.length > 0) setClassId(manageableClasses[0].id)
  }, [manageableClasses, classId])

  async function loadAnnonces() {
    if (!classId) return
    setLoading(true)
    try {
      const data = await getAnnouncements(classId)
      setAnnonces(data)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erreur de chargement des annonces.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnonces()
  }, [classId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!classId || !title.trim() || !content.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      await createAnnouncement(classId, title.trim(), content.trim())
      setTitle('')
      setContent('')
      setMessage('Annonce publiée.')
      toast('Annonce publiée.')
      sendPushToRole('student', 'Nouvelle annonce', title.trim(), 'announcement').catch(() => {})
      playSuccess()
      await loadAnnonces()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors de la publication.')
      toastError('Erreur.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncement(id)
      setMessage('Annonce supprimée.')
      toast('Annonce supprimée.')
      setDeleteConfirmId(null)
      await loadAnnonces()
    } catch {
      setMessage('Erreur de suppression.')
      toastError('Erreur.')
    }
  }

  async function handleEditSave(id: string) {
    if (!editTitle.trim() || !editContent.trim()) return
    try {
      await updateAnnouncement(id, editTitle.trim(), editContent.trim())
      toast('Annonce modifiée.')
      setEditingId(null)
      await loadAnnonces()
    } catch {
      toastError('Erreur lors de la modification.')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Publier une annonce</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Envoie une announcement aux étudiants de ta classe.
        </CardDescription>
        <form onSubmit={handleCreate} className="space-y-3 max-w-md">
          <div>
            <Label>Classe</Label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            >
              {manageableClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Contenu</Label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            />
          </div>
          {message && <p className="text-sm text-olive">{message}</p>}
          <Button type="submit" disabled={saving || !classId}>
            {saving ? 'Publication…' : 'Publier'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Annonces publiées</CardTitle>
        <CardDescription className="mt-1 mb-3">
          {annonces.length} annonce{annonces.length > 1 ? 's' : ''}
        </CardDescription>
        {loading ? (
          <p className="text-sm text-pierre">Chargement…</p>
        ) : annonces.length === 0 ? (
          <p className="text-sm text-pierre">Aucune annonce.</p>
        ) : (
          <ul className="space-y-2">
            {annonces.map((a) => (
              <li key={a.id} className="rounded-md border border-pierre/15 px-3 py-2.5">
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" />
                    <div className="flex gap-2">
                      <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => handleEditSave(a.id)}>Enregistrer</Button>
                      <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => setEditingId(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-bordeaux">{a.title}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(a.id); setEditTitle(a.title); setEditContent(a.content) }} className="text-xs text-or-texte dark:text-or underline">Modifier</button>
                        {deleteConfirmId === a.id ? (
                          <span className="flex gap-2">
                            <button onClick={() => handleDelete(a.id)} className="text-xs text-red-700 underline">Confirmer</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-pierre underline">Annuler</button>
                          </span>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(a.id)} className="text-xs text-red-700 underline">Supprimer</button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-pierre">{a.content}</p>
                    <p className="mt-1 text-xs text-pierre/70">{a.created_at ? formatShortDate(a.created_at) : ''}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
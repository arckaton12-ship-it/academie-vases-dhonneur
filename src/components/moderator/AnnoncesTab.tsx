import { FormEvent, useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { getAnnouncements, createAnnouncement, deleteAnnouncement, updateAnnouncement, ClassRow, Announcement } from '@/lib/courses'
import { sendPushToRole } from '@/lib/pushSend'
import { playSuccess } from '@/lib/sound'
import { toast, toastError } from '@/components/ui/Toast'

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
    } catch {
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
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur de suppression.')
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
          Envoie un message visible par les étudiants de ta classe (événement, rappel, info importante).
        </CardDescription>
        <div className="mb-3">
          <Label htmlFor="annonce-class">Classe</Label>
          <select
            id="annonce-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
          >
            {manageableClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <Label htmlFor="annonce-title">Titre</Label>
            <Input
              id="annonce-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Réunion spéciale dimanche"
            />
          </div>
          <div>
            <Label htmlFor="annonce-content">Contenu</Label>
            <textarea
              id="annonce-content"
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Décris l'annonce…"
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or"
            />
          </div>
          <p className="mt-1 mb-3 text-xs text-pierre/70 italic">
            Les étudiants verront "Bonjour [prénom]," en début de message (personnalisé automatiquement).
          </p>
          <Button type="submit" disabled={saving}>
            {saving ? 'Publication…' : 'Publier l\u2019annonce'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Annonces publiées</CardTitle>
        {loading ? (
          <p className="text-sm text-pierre">Chargement…</p>
        ) : annonces.length === 0 ? (
          <p className="text-sm text-pierre">Aucune annonce pour cette classe.</p>
        ) : (
          <ul className="space-y-3">
            {annonces.map((a) => (
              <li key={a.id} className="rounded-card border border-pierre/15 p-3">
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titre..." />
                    <textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditSave(a.id)}>Enregistrer</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-bordeaux">{a.title}</p>
                      <p className="mt-1 text-sm text-pierre whitespace-pre-wrap">{a.content}</p>
                      <p className="mt-2 text-[11px] text-pierre">
                        {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { setEditingId(a.id); setEditTitle(a.title); setEditContent(a.content); }} className="text-xs text-olive underline">Modifier</button>
                      {deleteConfirmId === a.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(a.id)} className="text-xs text-red-700 underline">Oui</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-pierre underline">Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(a.id)} className="text-xs text-red-700 underline">Supprimer</button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {message && <p className="text-sm text-olive">{message}</p>}
    </div>
  )
}
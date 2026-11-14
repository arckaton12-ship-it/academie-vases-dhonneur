import { FormEvent, useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { toast, toastError } from '@/components/ui/Toast'
import { playSuccess } from '@/lib/sound'
import { sendPushToRole } from '@/lib/pushSend'
import {
  getAnnouncements,
  createAnnouncement,
  createBroadcastAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  Announcement,
  ClassRow,
  Course,
} from '@/lib/courses'

export function AdminAnnoncesTab({ classes, allCourses }: { classes: ClassRow[]; allCourses: Course[] }) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [annonces, setAnnonces] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [viewClass, setViewClass] = useState(classes[0]?.id ?? '')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!viewClass) { setLoading(false); return }
    setLoading(true)
    getAnnouncements(viewClass)
      .then(setAnnonces)
      .catch(() => setAnnonces([]))
      .finally(() => setLoading(false))
  }, [viewClass])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    setMsg(null)
    try {
      if (selectedClassId === 'ALL') {
        const count = await createBroadcastAnnouncement(title.trim(), content.trim())
        setMsg(`Annonce publiée pour ${count} classe${count > 1 ? 's' : ''}.`)
        toast(`Annonce publiée pour ${count} classe${count > 1 ? 's' : ''}.`)
      } else {
        if (!selectedClassId) { setMsg('Choisis une classe.'); setSaving(false); return }
        await createAnnouncement(selectedClassId, title.trim(), content.trim())
        setMsg('Annonce publiée.')
        toast('Annonce publiée.')
      }
      playSuccess()
      sendPushToRole('student', 'Nouvelle annonce', title.trim(), 'announcement').catch(() => {})
      setTitle('')
      setContent('')
      if (viewClass) {
        const data = await getAnnouncements(viewClass)
        setAnnonces(data)
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erreur lors de la publication.')
      toastError('Erreur.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditSave(id: string) {
    if (!editTitle.trim() || !editContent.trim()) return
    try {
      await updateAnnouncement(id, editTitle.trim(), editContent.trim())
      toast('Annonce modifiée.')
      setEditingId(null)
      if (viewClass) {
        const data = await getAnnouncements(viewClass)
        setAnnonces(data)
      }
    } catch {
      toastError('Erreur lors de la modification.')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncement(id)
      toast('Annonce supprimée.')
      setDeleteConfirmId(null)
      if (viewClass) {
        const data = await getAnnouncements(viewClass)
        setAnnonces(data)
      }
    } catch {
      toastError('Erreur lors de la suppression.')
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Publier une annonce</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Envoie une annonce à tous les étudiants d'une classe.
        </CardDescription>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <Label>Classe destination</Label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
            >
              <option value="">— Choisir une classe —</option>
              <option value="ALL">📢 Toutes les classes (commun)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Titre</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'annonce..."
              required
            />
          </div>
          <div>
            <Label>Contenu</Label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ton message pour la classe..."
              className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
              required
            />
          </div>
          <p className="mt-1 mb-3 text-xs text-pierre/70 italic">
            Les étudiants verront "Bonjour [prénom]," en début de message (personnalisé automatiquement).
          </p>
          <Button type="submit" disabled={saving}>
            {saving ? 'Publication...' : 'Publier l\'annonce'}
          </Button>
          {msg && <p className="text-sm text-olive">{msg}</p>}
        </form>
      </Card>

      <Card>
        <CardTitle>Annonces publiées</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Historique des annonces par classe.
        </CardDescription>
        <div className="mb-3">
          <select
            value={viewClass}
            onChange={(e) => setViewClass(e.target.value)}
            className="rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-sm text-pierre">Chargement...</p>
        ) : annonces.length === 0 ? (
          <p className="text-sm text-pierre">Aucune annonce pour cette classe.</p>
        ) : (
          <ul className="space-y-3">
            {annonces.map((a) => (
              <li key={a.id} className="rounded-card border border-pierre/15 p-4">
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titre..." />
                    <textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or focus-visible:outline-none" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditSave(a.id)}>Enregistrer</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-bordeaux">{a.title}</p>
                    <p className="mt-1 text-sm text-pierre whitespace-pre-wrap">{a.content}</p>
                    <p className="mt-2 text-[11px] text-pierre">
                      {a.moderator?.first_name} {a.moderator?.last_name} —{' '}
                      {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(a.id); setEditTitle(a.title); setEditContent(a.content); }}>Modifier</Button>
                      {deleteConfirmId === a.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)}>Confirmer</Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>Non</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(a.id)}>Supprimer</Button>
                      )}
                    </div>
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

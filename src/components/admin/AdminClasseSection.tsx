import { FormEvent, useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { toast, toastError } from '@/components/ui/Toast'
import { playSuccess } from '@/lib/sound'
import { supabase } from '@/lib/supabase'
import { adminCreateUser, ClassRow } from '@/lib/courses'

export function AdminClasseSection({ classes }: { classes: ClassRow[] }) {
  const [admins, setAdmins] = useState<{ id: string; first_name: string; last_name: string; email: string; active: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [assignedClasses, setAssignedClasses] = useState<Record<string, string[]>>({})
  const [newAc, setNewAc] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [acMsg, setAcMsg] = useState<string | null>(null)
  const [acSaving, setAcSaving] = useState(false)
  const [createdPwd, setCreatedPwd] = useState<string | null>(null)
  const [showAcPwd, setShowAcPwd] = useState(false)

  async function loadAdmins() {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_admin_classe_list')
      if (error) {
        console.error('[AdminClasse] loadAdmins error:', JSON.stringify({ message: error.message, code: error.code, details: error.details, hint: error.hint }))
        throw error
      }
      const list = (data ?? []) as { id: string; first_name: string; last_name: string; email: string; active: boolean; assigned_classes: string[] }[]
      console.log('[AdminClasse] loadAdmins result:', list.length, 'admins')
      setAdmins(list.map(({ assigned_classes, ...rest }) => rest))

      const assigned: Record<string, string[]> = {}
      for (const ac of list) {
        assigned[ac.id] = ac.assigned_classes ?? []
      }
      setAssignedClasses(assigned)
    } catch (err) {
      console.error('[AdminClasse] loadAdmins failed:', err)
      setAcMsg('Erreur de chargement des admins de classe.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAdmins() }, [])

  async function handleCreateAc(e: FormEvent) {
    e.preventDefault()
    if (!newAc.email.trim() || !newAc.firstName.trim() || !newAc.lastName.trim() || !newAc.password) {
      setAcMsg('Remplis tous les champs.')
      return
    }
    setAcSaving(true)
    setAcMsg(null)
    setCreatedPwd(null)
    try {
      await adminCreateUser({
        email: newAc.email.trim(),
        password: newAc.password,
        firstName: newAc.firstName.trim(),
        lastName: newAc.lastName.trim(),
        role: 'ADMIN_CLASSE',
      })
      setAcMsg('Compte créé. Mot de passe temporaire à transmettre :')
      setCreatedPwd(newAc.password)
      toast('Compte admin de classe créé.')
      playSuccess()
      setNewAc({ firstName: '', lastName: '', email: '', password: '' })
      await loadAdmins()
    } catch (err) {
      setAcMsg(err instanceof Error ? err.message : 'Erreur de création.')
      toastError('Erreur.')
    } finally {
      setAcSaving(false)
    }
  }

  async function toggleAssign(adminId: string, classId: string) {
    const current = assignedClasses[adminId] ?? []
    const isAssigned = current.includes(classId)
    try {
      const { error } = await supabase.rpc('admin_toggle_class', {
        p_admin_id: adminId,
        p_class_id: classId,
        p_assign: !isAssigned,
      })
      if (error) throw error
      toast(isAssigned ? 'Classe retirée.' : 'Classe assignée.')
      await loadAdmins()
    } catch (err) {
      console.error('[AdminClasse] toggleAssign failed:', err)
      toastError('Erreur.')
    }
  }

  async function toggleActive(adminId: string, currentActive: boolean) {
    try {
      const { error } = await supabase.rpc('admin_toggle_active', { p_user_id: adminId })
      if (error) throw error
      toast(currentActive ? 'Accès révoqué.' : 'Accès restauré.')
      await loadAdmins()
    } catch (err) {
      console.error('[AdminClasse] toggleActive failed:', err)
      toastError('Erreur.')
    }
  }

  async function deleteAc(adminId: string) {
    if (!window.confirm('Supprimer cet admin de classe et toutes ses assignations ?')) return
    try {
      const { error } = await supabase.rpc('admin_delete_ac', { p_admin_id: adminId })
      if (error) throw error
      toast('Admin de classe supprimé.')
      await loadAdmins()
    } catch (err) {
      console.error('[AdminClasse] deleteAc failed:', err)
      toastError('Erreur.')
    }
  }

  const classeClasses = classes.filter(c => c.level <= 3)

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Créer un admin de classe</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Crée un compte admin de classe. Il pourra gérer les notes, présences et assiduités de SA classe.
        </CardDescription>
        <form onSubmit={handleCreateAc} className="space-y-3 max-w-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Prénom *</Label>
              <Input value={newAc.firstName} onChange={(e) => setNewAc(p => ({ ...p, firstName: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={newAc.lastName} onChange={(e) => setNewAc(p => ({ ...p, lastName: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={newAc.email} onChange={(e) => setNewAc(p => ({ ...p, email: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label>Mot de passe *</Label>
            <div className="relative">
              <Input
                type={showAcPwd ? 'text' : 'password'}
                value={newAc.password}
                onChange={(e) => setNewAc(p => ({ ...p, password: e.target.value }))}
                className="mt-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAcPwd(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-pierre hover:text-bordeaux"
              >
                {showAcPwd ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          {acMsg && <p className="text-sm text-olive">{acMsg}</p>}
          {createdPwd && (
            <div className="rounded-lg border border-or/40 bg-or/5 p-3">
              <p className="text-xs text-pierre">Mot de passe temporaire à transmettre :</p>
              <p className="mt-1 font-mono text-sm font-bold text-bordeaux break-all">{createdPwd}</p>
              <p className="mt-1 text-[11px] text-pierre/60">Il devra le changer à sa première connexion.</p>
              <button type="button" onClick={() => { navigator.clipboard.writeText(createdPwd); toast('Copié !') }} className="mt-2 rounded-md bg-bordeaux px-3 py-1 text-xs text-parchemin hover:bg-[#4a2234]">
                Copier le mot de passe
              </button>
            </div>
          )}
          <Button type="submit" disabled={acSaving}>
            {acSaving ? 'Création…' : 'Créer le compte'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Admins de classe existants</CardTitle>
        <CardDescription className="mt-1 mb-3">
          {admins.length} admin{admins.length > 1 ? 's' : ''} de classe · Clique sur une classe pour assigner/désassigner
        </CardDescription>
        {loading ? (
          <p className="text-sm text-pierre">Chargement…</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-pierre">Aucun admin de classe créé.</p>
        ) : (
          <ul className="space-y-4">
            {admins.map(ac => {
              const myClasses = assignedClasses[ac.id] ?? []
              return (
                <li key={ac.id} className="rounded-card border border-pierre/15 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-bordeaux">{ac.first_name} {ac.last_name}</p>
                      <p className="text-xs text-pierre">
                        {ac.email} · {ac.active ? 'accès actif' : 'accès révoqué'}
                      </p>
                      {myClasses.length > 0 && (
                        <p className="mt-1 text-xs text-or-texte dark:text-or">
                          Classe{myClasses.length > 1 ? 's' : ''} : {myClasses.map(id => classes.find(c => c.id === id)?.name?.split(' : ')[0]).filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant={ac.active ? 'ghost' : 'primary'} className="!px-3 !py-1 text-xs" onClick={() => toggleActive(ac.id, ac.active)}>
                        {ac.active ? 'Révoquer' : 'Restaurer'}
                      </Button>
                      <Button variant="outline" className="!px-3 !py-1 text-xs text-red-700" onClick={() => deleteAc(ac.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-sable/60 pt-3">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-bordeaux">Assigner une classe</p>
                    <div className="flex flex-wrap gap-2">
                      {classeClasses.map(c => {
                        const assigned = myClasses.includes(c.id)
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleAssign(ac.id, c.id)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              assigned
                                ? 'bg-bordeaux text-parchemin'
                                : 'border border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                            }`}
                          >
                            {c.name.split(' : ')[0]}{assigned ? ' ✓' : ''}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

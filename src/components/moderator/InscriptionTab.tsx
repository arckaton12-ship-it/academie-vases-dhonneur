import { FormEvent, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { adminCreateUser, ClassRow } from '@/lib/courses'
import { playSuccess } from '@/lib/sound'
import { toast, toastError } from '@/components/ui/Toast'

export function InscriptionTab({
  ownClassIds,
  classes,
  onCreated,
}: {
  ownClassIds: string[]
  classes: ClassRow[]
  onCreated: () => void
}) {
  const myClasses = classes.filter((c) => ownClassIds.includes(c.id))
  const [classId, setClassId] = useState(myClasses[0]?.id ?? '')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [tribe, setTribe] = useState('')
  const [password, setPassword] = useState('Etudiant123!')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!classId || !firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Remplis au moins le prénom, le nom, l\'email et la classe.'); return
    }
    setLoading(true); setError(null); setMessage(null)
    try {
      await adminCreateUser({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'ETUDIANT',
        phone: phone.trim() || undefined,
        tribe: tribe.trim() || undefined,
      })
      // Assign class
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .single()
      if (profile) {
        await supabase.from('profiles').update({ class_id: classId }).eq('id', profile.id)
      }
      setMessage(`${firstName} ${lastName} inscrit(e) dans la classe ${myClasses.find((c) => c.id === classId)?.name ?? ''}.`)
      toast(`${firstName} ${lastName} inscrit(e) dans la classe ${myClasses.find((c) => c.id === classId)?.name ?? ''}.`)
      playSuccess()
      setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setTribe('')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription.')
      toastError('Erreur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardTitle>Inscrire un étudiant</CardTitle>
      <CardDescription className="mt-1 mb-4">
        Crée un compte étudiant et l'attribue à l'une de tes classes.
      </CardDescription>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <div>
          <Label>Classe *</Label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 w-full rounded-card border border-pierre/20 bg-white px-3 py-2 text-sm"
          >
            {myClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (Niveau {c.level})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Prénom *</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" className="mt-1" />
          </div>
          <div>
            <Label>Nom *</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Kamga" className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Email *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean@email.com" className="mt-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237…" className="mt-1" />
          </div>
          <div>
            <Label>Tribu</Label>
            <select value={tribe} onChange={(e) => setTribe(e.target.value)} className="mt-1 w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux focus-visible:border-or">
              <option value="">—</option>
              {['Ruben', 'Siméon', 'Lévi', 'Juda', 'Zabulon', 'Issacar', 'Dan', 'Gad', 'Aser', 'Nephtali', 'Joseph', 'Benjamin', 'Aucune'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label>Mot de passe</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
          <p className="text-[10px] text-pierre mt-1">Par défaut : Etudiant123!</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-olive">{message}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Inscription…' : 'Inscrire l\'étudiant'}
        </Button>
      </form>
    </Card>
  )
}
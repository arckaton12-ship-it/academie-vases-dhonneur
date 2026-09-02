import { FormEvent, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, FieldError } from '@/components/ui/Input'
import { toastError, toast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'

interface ForcePasswordChangeProps {
  onDone: () => void
}

export function ForcePasswordChange({ onDone }: ForcePasswordChangeProps) {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPass.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPass !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('change_my_password', {
        p_current_password: current,
        p_new_password: newPass,
      })
      if (rpcError) throw rpcError
      if (data?.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      setSuccess(true)
      toast('Mot de passe changé avec succès !')
      setTimeout(onDone, 1500)
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du changement de mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-or/15 text-or">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <CardTitle>Changement de mot de passe requis</CardTitle>
          <CardDescription className="mt-1">
            Pour sécuriser ton compte, tu dois modifier ton mot de passe avant de continuer.
          </CardDescription>
        </div>

        {success ? (
          <div className="rounded-md bg-olive/10 p-3 text-center text-sm text-olive">
            Mot de passe modifie avec succes !
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              placeholder="Mot de passe actuel"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Nouveau mot de passe (min. 8 caracteres)"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              minLength={8}
            />
            <Input
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Changer mon mot de passe'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}

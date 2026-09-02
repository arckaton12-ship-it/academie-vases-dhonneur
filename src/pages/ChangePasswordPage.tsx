import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { Logo } from '@/components/Logo'
import { SectionWatermark } from '@/components/SectionWatermark'
import { supabase } from '@/lib/supabase'
import { getSafeSession } from '@/lib/auth'
import { toast } from '@/components/ui/Toast'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      // Update password
      const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword })
      if (pwdError) throw pwdError

      // Clear must_change_password flag
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', getSafeSession()?.user?.id ?? '')
      if (profileError) throw profileError

      // Determine redirect based on role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', getSafeSession()?.user?.id ?? '')
        .single()
      
      toast('Mot de passe mis à jour !')
      if (profile?.role === 'ADMIN_CLASSE') navigate('/admin-classe/tableau-de-bord')
      else if (profile?.role === 'ADMINISTRATEUR') navigate('/admin/tableau-de-bord')
      else if (profile?.role === 'ETUDIANT') navigate('/etudiant/tableau-de-bord')
      else navigate('/moderateur/tableau-de-bord')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <SectionWatermark kind="croix" />
      <Card className="relative z-10 w-full max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Logo showText={false} size={32} />
          <div>
            <CardTitle>Changement de mot de passe</CardTitle>
            <CardDescription>Tu dois modifier ton mot de passe temporaire pour continuer.</CardDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retape le même mot de passe"
            />
          </div>

          {error && <p className="text-sm text-rouge">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enregistrement…' : 'Changer mon mot de passe'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

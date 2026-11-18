import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Logo } from '@/components/Logo'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { SectionWatermark } from '@/components/SectionWatermark'
import { supabase } from '@/lib/supabase'
import { changePassword, signOut } from '@/lib/auth'

type Status = 'checking' | 'ready' | 'invalid' | 'done'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let timer: number | undefined

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setStatus('ready')
    })

    // Supabase place l'erreur éventuelle dans le hash ou la query string.
    const raw = `${window.location.hash.replace(/^#/, '')}&${window.location.search.replace(/^\?/, '')}`
    const params = new URLSearchParams(raw)
    const urlError = params.get('error_description') || params.get('error')

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) {
        setStatus('ready')
        return
      }
      if (urlError) {
        setStatus('invalid')
        return
      }
      // detectSessionInUrl peut prendre un instant avant de publier la session.
      timer = window.setTimeout(() => {
        if (mounted) setStatus((current) => (current === 'checking' ? 'invalid' : current))
      }, 2500)
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await changePassword(password)
      await signOut().catch(() => undefined)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <SectionWatermark kind="croix" />
      <div className="absolute right-4 top-4 z-20">
        <DarkModeToggle />
      </div>

      <Card className="relative z-10 w-full max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Logo showText={false} size={32} />
          <CardTitle className="mb-0">Nouveau mot de passe</CardTitle>
        </div>

        {status === 'checking' && (
          <p className="text-sm text-pierre dark:text-slate-400">Vérification du lien…</p>
        )}

        {status === 'invalid' && (
          <div className="space-y-4">
            <div className="rounded-card border border-rouge/30 bg-rouge/5 p-4">
              <p className="text-sm text-bordeaux dark:text-slate-200">
                Ce lien est invalide ou a expiré. Demande un nouveau lien pour continuer.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate('/mot-de-passe-oublie')}>
              Demander un nouveau lien
            </Button>
            <p className="text-center text-sm">
              <Link
                to="/etudiant/connexion"
                className="font-medium text-bordeaux underline underline-offset-2 hover:text-olive dark:text-or"
              >
                Retour à la connexion
              </Link>
            </p>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-4">
            <div className="rounded-card border border-bordeaux/20 bg-bordeaux/5 p-4 dark:border-or/20 dark:bg-or/5">
              <p className="text-sm text-bordeaux dark:text-slate-200">
                Ton mot de passe a bien été mis à jour. Tu peux maintenant te connecter.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate('/etudiant/connexion')}>
              Se connecter
            </Button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <CardDescription className="mb-4">
              Choisis un nouveau mot de passe pour ton compte.
            </CardDescription>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-pierre hover:text-bordeaux dark:hover:text-or"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-pierre dark:text-slate-500">Au moins 6 caractères</p>
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <FieldError>{error ?? undefined}</FieldError>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </main>
  )
}

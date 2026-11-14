import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Logo } from '@/components/Logo'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { SectionWatermark } from '@/components/SectionWatermark'
import { requestPasswordReset } from '@/lib/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full bg-bordeaux/20 blur-[110px] dark:bg-bordeaux/30" />
        <div className="aurora-blob absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-or/20 blur-[110px] [animation-delay:-6s] dark:bg-or/15" />
      </div>
      <SectionWatermark kind="croix" />
      <div className="absolute right-4 top-4 z-20">
        <DarkModeToggle />
      </div>

      <Card className="relative z-10 w-full max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Logo showText={false} size={32} />
          <CardTitle className="mb-0">Mot de passe oublié</CardTitle>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-card border border-bordeaux/20 bg-bordeaux/5 p-4 dark:border-or/20 dark:bg-or/5">
              <p className="text-sm text-bordeaux dark:text-slate-200">
                Si un compte existe avec <span className="font-medium">{email}</span>, tu recevras un
                email contenant un lien pour choisir un nouveau mot de passe.
              </p>
            </div>
            <p className="text-xs text-pierre dark:text-slate-400">
              Pense à vérifier les courriers indésirables. Le lien reste valable une heure.
            </p>
            <Link
              to="/etudiant/connexion"
              className="inline-block text-sm font-medium text-bordeaux underline underline-offset-2 hover:text-olive dark:text-or"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <CardDescription className="mb-4">
              Saisis l'adresse email de ton compte. Nous t'enverrons un lien sécurisé pour
              réinitialiser ton mot de passe.
            </CardDescription>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton.email@exemple.com"
                />
              </div>
              <FieldError>{error ?? undefined}</FieldError>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Envoi…' : 'Recevoir le lien'}
              </Button>
            </form>
            <p className="mt-5 border-t border-sable/60 pt-4 text-center text-sm">
              <Link
                to="/etudiant/connexion"
                className="font-medium text-bordeaux underline underline-offset-2 hover:text-olive dark:text-or"
              >
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </Card>
    </main>
  )
}

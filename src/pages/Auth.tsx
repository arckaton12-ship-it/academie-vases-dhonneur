import { useNavigate, Link } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { AuthForm } from '@/components/AuthForm'
import { Logo } from '@/components/Logo'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { SectionWatermark } from '@/components/SectionWatermark'
import { VerseReference } from '@/components/VerseReference'
import { getCurrentProfile, UserRole } from '@/lib/auth'

interface AuthPageProps {
  mode: 'signup' | 'signin'
  role: UserRole
  title: string
  redirectTo: string
}

const BASE_PATHS: Record<UserRole, string> = {
  ETUDIANT: '/etudiant',
  ADMINISTRATEUR: '/admin',
  MODERATEUR: '/moderateur',
}

const DASHBOARDS: Record<UserRole, string> = {
  ETUDIANT: '/etudiant/tableau-de-bord',
  ADMINISTRATEUR: '/admin/tableau-de-bord',
  MODERATEUR: '/moderateur/tableau-de-bord',
}

export function AuthPage({ mode, role, title, redirectTo }: AuthPageProps) {
  const navigate = useNavigate()
  const base = BASE_PATHS[role]
  const alternatePath = mode === 'signup' ? `${base}/connexion` : `${base}/inscription`
  const alternateLabel =
    mode === 'signup' ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"

  const restrictedSignup = mode === 'signup' && role !== 'ETUDIANT'
  const isStudent = role === 'ETUDIANT'

  async function handleSuccess() {
    try {
      const profile = await getCurrentProfile()
      if (profile?.role === 'ADMINISTRATEUR') {
        navigate('/admin/tableau-de-bord')
        return
      }
      if (profile?.role === 'MODERATEUR') {
        navigate('/moderateur/tableau-de-bord')
        return
      }
      if (profile?.role === 'ETUDIANT') {
        navigate('/etudiant/tableau-de-bord')
        return
      }
    } catch {
      // profil illisible : on garde la redirection par défaut
    }
    navigate(redirectTo)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <SectionWatermark kind="croix" />
      <div className="absolute right-4 top-4 z-20">
        <DarkModeToggle />
      </div>
      <Card className="relative z-10 w-full max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Logo showText={false} size={32} />
          <CardTitle className="mb-0">{title}</CardTitle>
          <VerseReference className="ml-auto" />
        </div>
        {restrictedSignup ? (
          <>
            <CardDescription className="mb-4">
              La création d'un compte administrateur ou modérateur est réservée à l'administration.
              Les membres de l'administration ne s'inscrivent pas : leur compte est créé par
              l'administrateur principal. Si tu es déjà membre de l'Académie, connecte-toi.
            </CardDescription>
            <Link
              to={alternatePath}
              className="inline-block rounded-md bg-bordeaux px-4 py-2 text-sm font-medium text-parchemin hover:bg-[#4a2234]"
            >
              Se connecter
            </Link>
          </>
        ) : (
          <AuthForm mode={mode} role={role} onSuccess={handleSuccess} />
        )}
        <p className="mt-5 border-t border-sable/60 pt-4 text-center text-sm">
          <Link
            to={isStudent ? alternatePath : '/etudiant/inscription'}
            className="font-medium text-bordeaux underline underline-offset-2 hover:text-[#4a2234]"
          >
            {isStudent ? alternateLabel : "Tu es apprenant ? Créer un compte étudiant"}
          </Link>
        </p>
      </Card>
    </div>
  )
}

export const StudentSignup = () => (
  <AuthPage mode="signup" role="ETUDIANT" title="Inscription étudiant" redirectTo="/etudiant/tableau-de-bord" />
)
export const StudentLogin = () => (
  <AuthPage mode="signin" role="ETUDIANT" title="Connexion étudiant" redirectTo="/etudiant/tableau-de-bord" />
)
export const AdminSignup = () => (
  <AuthPage mode="signup" role="ADMINISTRATEUR" title="Inscription administration" redirectTo="/admin/tableau-de-bord" />
)
export const AdminLogin = () => (
  <AuthPage mode="signin" role="ADMINISTRATEUR" title="Connexion administration" redirectTo="/admin/tableau-de-bord" />
)
export const ModeratorSignup = () => (
  <AuthPage mode="signup" role="MODERATEUR" title="Inscription modérateur" redirectTo="/moderateur/tableau-de-bord" />
)
export const ModeratorLogin = () => (
  <AuthPage mode="signin" role="MODERATEUR" title="Connexion modérateur" redirectTo="/moderateur/tableau-de-bord" />
)

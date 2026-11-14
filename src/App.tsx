import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useState, useCallback, useEffect } from 'react'
import { Sentry } from '@/lib/sentry'
import Landing from '@/pages/Landing'
import { StudentSignup, StudentLogin, AdminSignup, AdminLogin, ModeratorSignup, ModeratorLogin, AdminClasseLogin } from '@/pages/Auth'
import { RequireRole } from '@/components/RequireRole'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserRole } from '@/lib/auth'
import { SplashScreen, shouldShowSplash, markSplashSeen } from '@/components/SplashScreen'
import { ToastContainer } from '@/components/ui/Toast'
import { PWAInstall, PWAInstallButton } from '@/components/PWAInstall'
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'
import { SentryTestPage } from '@/pages/SentryTestPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { ContactPage } from '@/pages/ContactPage'
import { LegalPage } from '@/pages/LegalPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const MODERATOR_ROLES: UserRole[] = ['MODERATEUR', 'ADMINISTRATEUR']
const ADMIN_CLASSE_ROLES: UserRole[] = ['ADMIN_CLASSE']

// Les quatre tableaux de bord sont chargés à la demande : un visiteur qui
// découvre l'accueil ne télécharge ni l'administration ni jsPDF.
const StudentDashboard = lazy(() => import('@/pages/StudentDashboard'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const ModeratorDashboard = lazy(() => import('@/pages/ModeratorDashboard'))
const AdminClasseDashboard = lazy(() => import('@/pages/AdminClasseDashboard'))

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-card flex items-center gap-3 px-6 py-4 text-sm text-pierre dark:text-slate-300">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-or border-t-transparent" />
        Chargement de ton espace…
      </div>
    </div>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(shouldShowSplash())
  const handleSplashComplete = useCallback(() => {
    markSplashSeen()
    setShowSplash(false)
  }, [])

  // Auto-refresh: check for new deployment every 60s
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version')
    const currentVersion = storedVersion || '0'
    let hasStoredVersion = storedVersion !== null

    const check = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
        if (!res.ok) return
        const { version } = await res.json()
        if (!version) return

        if (!hasStoredVersion) {
          localStorage.setItem('app_version', version)
          hasStoredVersion = true
          return
        }

        if (version !== currentVersion) {
          localStorage.setItem('app_version', version)
          window.location.reload()
        }
      } catch { /* ignore */ }
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])

  // Capture silent promise rejections
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      Sentry.captureException(event.reason)
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          {import.meta.env.DEV && <Route path="/test-sentry" element={<SentryTestPage />} />}

          <Route path="/contact" element={<ContactPage />} />
          <Route path="/mentions-legales" element={<LegalPage />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />

          <Route path="/etudiant/inscription" element={<StudentSignup />} />
          <Route path="/etudiant/connexion" element={<StudentLogin />} />
          <Route
            path="/etudiant/tableau-de-bord"
            element={
              <RequireRole roles={['ETUDIANT']}>
                <StudentDashboard />
              </RequireRole>
            }
          />

          <Route path="/admin/inscription" element={<AdminSignup />} />
          <Route path="/admin/connexion" element={<AdminLogin />} />
          <Route
            path="/admin/tableau-de-bord"
            element={
              <RequireRole roles={['ADMINISTRATEUR']}>
                <AdminDashboard />
              </RequireRole>
            }
          />

          <Route path="/moderateur/inscription" element={<ModeratorSignup />} />
          <Route path="/moderateur/connexion" element={<ModeratorLogin />} />
          <Route path="/moderateur/changer-mot-de-passe" element={<RequireRole roles={MODERATOR_ROLES}><ChangePasswordPage /></RequireRole>} />
          <Route path="/admin-classe/connexion" element={<AdminClasseLogin />} />
          <Route path="/admin-classe/changer-mot-de-passe" element={<RequireRole roles={ADMIN_CLASSE_ROLES}><ChangePasswordPage /></RequireRole>} />
          <Route
            path="/admin-classe/tableau-de-bord"
            element={
              <RequireRole roles={ADMIN_CLASSE_ROLES}>
                <AdminClasseDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/moderateur/tableau-de-bord"
            element={
              <RequireRole roles={MODERATOR_ROLES}>
                <ModeratorDashboard />
              </RequireRole>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </BrowserRouter>
        <PWAInstall />
        <PWAInstallButton />
        <ToastContainer />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

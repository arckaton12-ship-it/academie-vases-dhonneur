import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import { Sentry } from '@/lib/sentry'
import Landing from '@/pages/Landing'
import { StudentSignup, StudentLogin, AdminSignup, AdminLogin, ModeratorSignup, ModeratorLogin, AdminClasseLogin } from '@/pages/Auth'
import StudentDashboard from '@/pages/StudentDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import ModeratorDashboard from '@/pages/ModeratorDashboard'
import AdminClasseDashboard from '@/pages/AdminClasseDashboard'
import { RequireRole } from '@/components/RequireRole'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserRole } from '@/lib/auth'
import { SplashScreen, shouldShowSplash, markSplashSeen } from '@/components/SplashScreen'
import { ToastContainer } from '@/components/ui/Toast'
import { PWAInstall, PWAInstallButton } from '@/components/PWAInstall'
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'
import { SentryTestPage } from '@/pages/SentryTestPage'

const MODERATOR_ROLES: UserRole[] = ['MODERATEUR', 'ADMINISTRATEUR']
const ADMIN_CLASSE_ROLES: UserRole[] = ['ADMIN_CLASSE']

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
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/test-sentry" element={<SentryTestPage />} />

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

          <Route path="*" element={
            <div className="flex min-h-screen items-center justify-center px-4">
              <div className="text-center">
                <h1 className="font-display text-4xl text-bordeaux">404</h1>
                <p className="mt-2 text-sm text-pierre">Page introuvable.</p>
                <a href="/" className="mt-4 inline-block text-sm font-medium text-bordeaux underline">Retour à l'accueil</a>
              </div>
            </div>
          } />
        </Routes>
        </BrowserRouter>
        <PWAInstall />
        <PWAInstallButton />
        <ToastContainer />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

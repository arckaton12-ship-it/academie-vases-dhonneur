import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useCallback } from 'react'
import Landing from '@/pages/Landing'
import { StudentSignup, StudentLogin, AdminSignup, AdminLogin, ModeratorSignup, ModeratorLogin } from '@/pages/Auth'
import StudentDashboard from '@/pages/StudentDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import ModeratorDashboard from '@/pages/ModeratorDashboard'
import { RequireRole } from '@/components/RequireRole'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserRole } from '@/lib/auth'
import { SplashScreen, shouldShowSplash, markSplashSeen } from '@/components/SplashScreen'
import { ToastContainer } from '@/components/ui/Toast'
import { PWAInstall, PWAInstallButton } from '@/components/PWAInstall'
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'

const MODERATOR_ROLES: UserRole[] = ['MODERATEUR', 'ADMINISTRATEUR', 'ADMIN_CLASSE']

export default function App() {
  const [showSplash, setShowSplash] = useState(shouldShowSplash())
  const handleSplashComplete = useCallback(() => {
    markSplashSeen()
    setShowSplash(false)
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

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
          <Route path="/moderateur/changer-mot-de-passe" element={<ChangePasswordPage />} />
          <Route path="/admin-classe/connexion" element={<ModeratorLogin />} />
          <Route
            path="/moderateur/tableau-de-bord"
            element={
              <RequireRole roles={MODERATOR_ROLES}>
                <ModeratorDashboard />
              </RequireRole>
            }
          />

          <Route path="*" element={<Landing />} />
        </Routes>
        </BrowserRouter>
        <PWAInstall />
        <PWAInstallButton />
        <ToastContainer />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

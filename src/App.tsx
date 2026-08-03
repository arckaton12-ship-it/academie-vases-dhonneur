import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from '@/pages/Landing'
import { StudentSignup, StudentLogin, AdminSignup, AdminLogin, ModeratorSignup, ModeratorLogin } from '@/pages/Auth'
import StudentDashboard from '@/pages/StudentDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import ModeratorDashboard from '@/pages/ModeratorDashboard'
import { RequireRole } from '@/components/RequireRole'
import { UserRole } from '@/lib/auth'

const MODERATOR_ROLES: UserRole[] = ['MODERATEUR', 'ADMINISTRATEUR']

export default function App() {
  return (
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
  )
}

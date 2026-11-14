import { AdminSettingsTab } from '@/components/AdminSettingsTab'
import { signOut } from '@/lib/auth'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function ParametresSection() {
  const {
    adminProfile,
    formFirst,
    formName,
    formEmail,
    setFormFirst,
    setFormName,
    setFormEmail,
    profileSaving,
    profileError,
    profileDone,
    handleSaveProfile,
    navigate,
  } = useAdminDashboardContext()

  return (
        <AdminSettingsTab
          profile={adminProfile ?? { id: '', first_name: '', last_name: '', avatar_url: null }}
          formFirst={formFirst}
          formName={formName}
          formEmail={formEmail}
          setFormFirst={setFormFirst}
          setFormName={setFormName}
          setFormEmail={setFormEmail}
          profileSaving={profileSaving}
          profileError={profileError}
          profileDone={profileDone}
          onSaveProfile={handleSaveProfile}
          onSignOut={async () => { await signOut(); navigate('/') }}
        />
  )
}

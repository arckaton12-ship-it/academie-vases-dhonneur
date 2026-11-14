import { useNavigate } from 'react-router-dom'
import { SettingsTab } from '@/components/SettingsTab'
import { signOut } from '@/lib/auth'
import { useStudentDashboardContext } from '@/pages/student/StudentDashboardContext'

export function ParametresTab() {
  const { profile, earnedBadges, badgeBusy, formFirst, formName, formPhone, formTribe, formDept, setFormFirst, setFormName, setFormPhone, setFormTribe, setFormDept, profileSaving, profileError, profileDone, handleSaveProfile, handleSelectActiveBadge, setProfile } = useStudentDashboardContext()

  const navigate = useNavigate()
  if (!profile) return null

  return (
        <SettingsTab
          profile={profile}
          earnedBadges={earnedBadges}
          badgeBusy={badgeBusy}
          formFirst={formFirst}
          formName={formName}
          formPhone={formPhone}
          formTribe={formTribe}
          formDept={formDept}
          setFormFirst={setFormFirst}
          setFormName={setFormName}
          setFormPhone={setFormPhone}
          setFormTribe={setFormTribe}
          setFormDept={setFormDept}
          profileSaving={profileSaving}
          profileError={profileError}
          profileDone={profileDone}
          onSaveProfile={handleSaveProfile}
          onSelectBadge={handleSelectActiveBadge}
          onSignOut={async () => { await signOut(); navigate('/') }}
          onAvatarSaved={(url) => setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev)}
        />
  )
}

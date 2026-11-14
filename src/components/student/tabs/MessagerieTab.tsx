import { MessagingPanel } from '@/components/MessagingPanel'
import { useStudentDashboardContext } from '@/pages/student/StudentDashboardContext'

export function MessagerieTab() {
  const { profile } = useStudentDashboardContext()

  return (
        <div className="space-y-4">
          <MessagingPanel currentUserId={profile?.id ?? ''} userRole="ETUDIANT" />
        </div>
  )
}

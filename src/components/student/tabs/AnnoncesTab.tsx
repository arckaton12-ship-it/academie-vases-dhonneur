import { AnnoncesEtudiantTab } from '@/components/student/AnnoncesEtudiantTab'
import { useStudentDashboardContext } from '@/pages/student/StudentDashboardContext'

export function AnnoncesTab() {
  const { profile } = useStudentDashboardContext()

  return (
        <AnnoncesEtudiantTab classId={profile?.class_id ?? null} studentFirstName={profile?.first_name ?? null} />
  )
}

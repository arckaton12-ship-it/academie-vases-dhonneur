import { NotationTab } from '@/components/admin/NotationTab'
import { getStudents, getSubmissions } from '@/lib/courses'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function NotationSection() {
  const {
    setSubmissions,
    setStudents,
  } = useAdminDashboardContext()

  return (
        <NotationTab onGraded={() => {
          getSubmissions().then(setSubmissions).catch(() => {})
          getStudents().then(setStudents).catch(() => {})
        }} />
  )
}

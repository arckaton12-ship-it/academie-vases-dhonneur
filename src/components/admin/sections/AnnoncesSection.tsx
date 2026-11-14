import { AdminAnnoncesTab } from '@/components/admin/AdminAnnoncesTab'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function AnnoncesSection() {
  const {
    classes,
    courses,
  } = useAdminDashboardContext()

  return (
        <AdminAnnoncesTab
          classes={classes}
          allCourses={courses}
        />
  )
}

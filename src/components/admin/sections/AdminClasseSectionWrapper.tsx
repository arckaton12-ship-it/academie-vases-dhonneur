import { AdminClasseSection } from '@/components/admin/AdminClasseSection'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function AdminClasseSectionWrapper() {
  const {
    classes,
  } = useAdminDashboardContext()

  return (
        <AdminClasseSection classes={classes} />
  )
}

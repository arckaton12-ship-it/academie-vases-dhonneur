import { AdminClassRequestsTab } from '@/components/admin/AdminClassRequestsTab'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function DemandesSection() {
  const {
    classes,
  } = useAdminDashboardContext()

  return (
        <AdminClassRequestsTab classes={classes} />
  )
}

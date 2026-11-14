import { CoursTab } from '@/components/admin/CoursTab'
import { getCourses } from '@/lib/courses'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function CoursSection() {
  const {
    classes,
    courses,
    setCourses,
  } = useAdminDashboardContext()

  return (
        <CoursTab classes={classes} courses={courses} onRefresh={() => {
          getCourses().then(setCourses).catch(() => {})
        }} />
  )
}

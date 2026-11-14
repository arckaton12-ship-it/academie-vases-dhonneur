import { QuizTab } from '@/components/QuizTab'
import { useAdminDashboardContext } from '@/pages/admin/AdminDashboardContext'

export function QuizSection() {
  const {
    courses,
  } = useAdminDashboardContext()

  return (
        <QuizTab courses={courses} />
  )
}

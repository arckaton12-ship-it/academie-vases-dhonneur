import { createContext, ReactNode, useContext } from 'react'
import { useStudentDashboardState } from './useStudentDashboardState'

type StudentDashboardState = ReturnType<typeof useStudentDashboardState>

export const StudentDashboardContext = createContext<StudentDashboardState | null>(null)

export function StudentDashboardProvider({
  value,
  children,
}: {
  value: StudentDashboardState
  children: ReactNode
}) {
  return <StudentDashboardContext.Provider value={value}>{children}</StudentDashboardContext.Provider>
}

export function useStudentDashboardContext() {
  const ctx = useContext(StudentDashboardContext)
  if (!ctx) {
    throw new Error('useStudentDashboardContext must be used within StudentDashboardProvider')
  }
  return ctx
}

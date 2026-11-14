import { createContext, useContext, type ReactNode } from 'react'
import { useAdminDashboardState } from './useAdminDashboardState'

type AdminDashboardState = ReturnType<typeof useAdminDashboardState>

const AdminDashboardContext = createContext<AdminDashboardState | null>(null)

export function AdminDashboardProvider({
  value,
  children,
}: {
  value: AdminDashboardState
  children: ReactNode
}) {
  return <AdminDashboardContext.Provider value={value}>{children}</AdminDashboardContext.Provider>
}

export function useAdminDashboardContext() {
  const ctx = useContext(AdminDashboardContext)
  if (!ctx) throw new Error('useAdminDashboardContext must be used within AdminDashboardProvider')
  return ctx
}

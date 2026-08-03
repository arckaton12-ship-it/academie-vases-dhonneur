import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentProfile, signOut, UserRole } from '@/lib/auth'

interface RequireRoleProps {
  roles: UserRole[]
  children: ReactNode
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    getCurrentProfile()
      .then(async (profile) => {
        if (cancelled) return
        if (!profile || !roles.includes(profile.role as UserRole)) {
          navigate('/')
          return
        }
        if (profile.active === false) {
          await signOut().catch(() => undefined)
          if (cancelled) return
          navigate('/')
          return
        }
        setAllowed(true)
      })
      .catch(() => {
        if (!cancelled) navigate('/')
      })
    return () => {
      cancelled = true
    }
  }, [navigate, roles])

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-pierre">
        Vérification de l'accès…
      </div>
    )
  }

  return <>{children}</>
}

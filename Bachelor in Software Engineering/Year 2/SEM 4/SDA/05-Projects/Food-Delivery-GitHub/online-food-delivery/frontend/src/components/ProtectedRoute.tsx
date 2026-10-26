import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../store/AuthContext'
import type { Role } from '../types'
import { homeFor } from '../roles'

/** Requires any signed-in user; redirects to /login (remembering the target). */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth()
  const location = useLocation()
  if (!isAuthed) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

/** Requires a specific role; sends other roles to their own home. */
export function RoleRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { user, isAuthed } = useAuth()
  const location = useLocation()
  if (!isAuthed) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user?.role !== role) return <Navigate to={homeFor(user?.role)} replace />
  return <>{children}</>
}

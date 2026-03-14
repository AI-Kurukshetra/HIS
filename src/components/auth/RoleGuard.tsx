'use client'

import { useRole } from '@/lib/rbac/hooks'
import { hasPermission, canAccessRoute } from '@/lib/rbac/permissions'
import type { Permission } from '@/lib/rbac/permissions'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  children: React.ReactNode
  /** Show children only if user has this permission */
  permission?: Permission
  /** Show children only if user has one of these roles */
  roles?: UserRole[]
  /** Show children only if user can access this route */
  route?: string
  /** What to render when access is denied (default: nothing) */
  fallback?: React.ReactNode
}

/**
 * Wrap any UI element to conditionally render based on the current user's role/permissions.
 *
 * <RoleGuard permission="create_patient">
 *   <button>Register Patient</button>
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  permission,
  roles,
  route,
  fallback = null,
}: RoleGuardProps) {
  const { role, loading } = useRole()

  if (loading) return null
  if (!role) return <>{fallback}</>

  if (permission && !hasPermission(role, permission)) return <>{fallback}</>
  if (roles && !roles.includes(role)) return <>{fallback}</>
  if (route && !canAccessRoute(role, route)) return <>{fallback}</>

  return <>{children}</>
}

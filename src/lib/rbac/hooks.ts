'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hasPermission, canAccessRoute } from '@/lib/rbac/permissions'
import type { UserRole } from '@/types'
import type { Permission } from '@/lib/rbac/permissions'

export function useRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setRole((data?.role as UserRole) ?? null)
          setLoading(false)
        })
    })
  }, [])

  return { role, loading }
}

export function usePermission(permission: Permission): boolean {
  const { role } = useRole()
  if (!role) return false
  return hasPermission(role, permission)
}

export function useCanAccessRoute(pathname: string): boolean {
  const { role } = useRole()
  if (!role) return false
  return canAccessRoute(role, pathname)
}

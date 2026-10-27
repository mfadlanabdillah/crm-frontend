import type { ReactNode } from 'react'
import { useAuth } from './auth-context'
import type { Permission } from './roles'

/**
 * Menyembunyikan aksi yang tidak diizinkan. Ini kontrol UX, bukan keamanan:
 * backend tetap menolak request yang tidak sah.
 */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}) {
  const { can } = useAuth()
  return can(permission) ? children : fallback
}

import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@crm/api-client'
import { can } from './roles'
import type { Permission, Role } from './roles'

export interface AuthState {
  session: Session | null
  role: Role | null
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({
  session,
  children,
}: {
  session: Session | null
  children: ReactNode
}) {
  const value = useMemo<AuthState>(() => {
    const role = session?.user.role ?? null
    return {
      session,
      role,
      can: (permission: Permission) => can(role, permission),
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hanya dipakai di bawah `<AuthProvider>` (dirender oleh root route). */
export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  }
  return context
}

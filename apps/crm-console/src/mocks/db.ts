import type { Role, Session, User } from '@crm/api-client'

// The people who can sign in on the mock backend, one per role. The example domain
// (examples/mock-backend) seeds its data with the same ids.
const USERS: Record<Role, User> = {
  l1: { id: 'user-l1', name: 'Rani Lestari', email: 'rani.lestari@example.com', role: 'l1' },
  l2: { id: 'user-l2', name: 'Budi Santoso', email: 'budi.santoso@example.com', role: 'l2' },
  supervisor: {
    id: 'user-supervisor',
    name: 'Sari Wulandari',
    email: 'sari.wulandari@example.com',
    role: 'supervisor',
  },
  admin: {
    id: 'user-admin',
    name: 'Dewi Anggraini',
    email: 'dewi@example.com',
    role: 'admin',
  },
}

let currentSession: Session | null = null

export const db = {
  setSession(role: Role | null): Session | null {
    currentSession =
      role === null
        ? null
        : {
            user: USERS[role],
            expiresAt: new Date(Date.now() + 8 * 3_600_000).toISOString(),
          }
    return currentSession
  },

  getSession(): Session | null {
    return currentSession
  },
}

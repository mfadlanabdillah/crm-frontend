import type { Role } from '@crm/api-client'

export type { Role }

export const ROLES = ['l1', 'l2', 'supervisor', 'admin'] as const satisfies readonly Role[]

/** Aksi yang boleh dikontrol UI. Backend tetap penjaga akhir untuk semuanya. */
export type Permission =
  | 'case.view'
  | 'case.assign'
  | 'case.reassign'
  | 'case.status.update'
  | 'case.reply'
  | 'case.note.internal'
  | 'case.escalate'
  | 'case.export'
  | 'customer.view'
  | 'pii.view.full'
  | 'admin.settings'

const L1: readonly Permission[] = [
  'case.view',
  'case.status.update',
  'case.reply',
  'case.note.internal',
]

const L2: readonly Permission[] = [...L1, 'case.assign', 'case.escalate', 'customer.view']

const SUPERVISOR: readonly Permission[] = [...L2, 'case.reassign', 'case.export', 'pii.view.full']

const ADMIN: readonly Permission[] = [...SUPERVISOR, 'admin.settings']

/** Satu sumber kebenaran RBAC frontend. Jangan menebar `role === '...'` di komponen. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  l1: L1,
  l2: L2,
  supervisor: SUPERVISOR,
  admin: ADMIN,
}

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

import { describe, expect, it } from 'vitest'
import { ROLE_PERMISSIONS, ROLES, can } from './roles'
import type { Permission } from './roles'

describe('RBAC', () => {
  it('agen L1 tidak boleh reassign case', () => {
    expect(can('l1', 'case.reassign')).toBe(false)
    expect(can('l1', 'case.view')).toBe(true)
  })

  it('modul customer baru terbuka mulai L2', () => {
    expect(can('l1', 'customer.view')).toBe(false)
    expect(can('l2', 'customer.view')).toBe(true)
    expect(can('supervisor', 'customer.view')).toBe(true)
  })

  it('supervisor boleh reassign dan melihat PII utuh', () => {
    expect(can('supervisor', 'case.reassign')).toBe(true)
    expect(can('supervisor', 'pii.view.full')).toBe(true)
  })

  it('L2 boleh assign tapi belum boleh melihat PII utuh', () => {
    expect(can('l2', 'case.assign')).toBe(true)
    expect(can('l2', 'pii.view.full')).toBe(false)
  })

  it('admin memiliki seluruh permission', () => {
    const all = new Set<Permission>(Object.values(ROLE_PERMISSIONS).flat())
    for (const permission of all) {
      expect(can('admin', permission)).toBe(true)
    }
  })

  it('menolak semua permission saat belum login', () => {
    for (const permission of Object.values(ROLE_PERMISSIONS).flat()) {
      expect(can(null, permission)).toBe(false)
    }
  })

  it('setiap role punya case.view', () => {
    for (const role of ROLES) {
      expect(can(role, 'case.view')).toBe(true)
    }
  })
})

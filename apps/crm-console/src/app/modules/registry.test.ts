import { describe, expect, it } from 'vitest'
import { can, ROLES } from '@crm/auth'
import { findActiveModule, getVisibleModules, modules } from './registry'

describe('registry modul', () => {
  it('id dan basePath setiap modul unik', () => {
    expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length)
    expect(new Set(modules.map((module) => module.basePath)).size).toBe(modules.length)
  })

  it('a role sees exactly the modules whose permission it holds', () => {
    for (const role of ROLES) {
      const expected = modules
        .filter((module) => !module.permission || can(role, module.permission))
        .map((module) => module.id)
      expect(getVisibleModules(role).map((module) => module.id)).toEqual(expected)
    }
    expect(getVisibleModules(null)).toEqual([])
  })

  it('L1 sees the case module but not customer; L2 sees both', () => {
    const ids = (role: 'l1' | 'l2') => getVisibleModules(role).map((module) => module.id)
    expect(ids('l1')).toContain('case')
    expect(ids('l1')).not.toContain('customer')
    expect(ids('l2')).toEqual(expect.arrayContaining(['case', 'customer']))
  })

  it('menentukan modul aktif dari awalan path', () => {
    expect(findActiveModule('/cases')?.id).toBe('case')
    expect(findActiveModule('/cases/case-1')?.id).toBe('case')
    expect(findActiveModule('/customers/cust-1')?.id).toBe('customer')
    expect(findActiveModule('/casesX')).toBeUndefined()
    expect(findActiveModule('/login')).toBeUndefined()
  })
})

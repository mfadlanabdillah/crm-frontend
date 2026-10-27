import { describe, expect, it } from 'vitest'
import { findActiveModule, getVisibleModules, modules } from './registry'

describe('registry modul', () => {
  it('id dan basePath setiap modul unik', () => {
    expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length)
    expect(new Set(modules.map((module) => module.basePath)).size).toBe(modules.length)
  })

  it('agen L1 hanya melihat modul case; L2 ke atas juga melihat customer', () => {
    expect(getVisibleModules('l1').map((module) => module.id)).toEqual(['case'])
    expect(getVisibleModules('l2').map((module) => module.id)).toEqual(['case', 'customer'])
    expect(getVisibleModules(null)).toEqual([])
  })

  it('menentukan modul aktif dari awalan path', () => {
    expect(findActiveModule('/cases')?.id).toBe('case')
    expect(findActiveModule('/cases/case-1')?.id).toBe('case')
    expect(findActiveModule('/customers/cust-1')?.id).toBe('customer')
    expect(findActiveModule('/casesX')).toBeUndefined()
    expect(findActiveModule('/login')).toBeUndefined()
  })
})

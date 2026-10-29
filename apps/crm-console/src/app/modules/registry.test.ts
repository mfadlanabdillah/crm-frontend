import { describe, expect, it, vi } from 'vitest'
import { can, ROLES } from '@crm/auth'
import type { ModuleDefinition } from '@/modules/types'
import {
  allModules,
  findActiveModule,
  getVisibleModules,
  modules,
  registerRemoteModule,
} from './registry'

describe('registry modul', () => {
  it('ships no built-in module: every domain is a remote', () => {
    expect(modules).toEqual([])
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

  // Modules come from remotes at runtime; these fixtures stand in for them. They stay registered for
  // the rest of the file.
  const fake = (id: string, basePath: string, permission?: ModuleDefinition['permission']) =>
    ({ id, labelKey: `${id}.title`, basePath, permission }) as unknown as ModuleDefinition

  it('a module needs its permission to be visible, and is found by path prefix', () => {
    registerRemoteModule(fake('zz-case', '/zz-cases', 'case.view'))
    registerRemoteModule(fake('zz-customer', '/zz-customers', 'customer.view'))
    const ids = (role: 'l1' | 'l2') => getVisibleModules(role).map((module) => module.id)

    expect(ids('l1')).toContain('zz-case')
    expect(ids('l1')).not.toContain('zz-customer')
    expect(ids('l2')).toEqual(expect.arrayContaining(['zz-case', 'zz-customer']))

    expect(findActiveModule('/zz-cases')?.id).toBe('zz-case')
    expect(findActiveModule('/zz-cases/case-1')?.id).toBe('zz-case')
    expect(findActiveModule('/zz-casesX')).toBeUndefined()
    expect(findActiveModule('/login')).toBeUndefined()
  })

  // Keep last: a registered remote module stays in the registry for the rest of the file.
  it('adds remote modules once, shows them to every role, and finds them by path', () => {
    const remote = {
      id: 'zz-remote',
      labelKey: 'zz.title',
      basePath: '/remote/zz-remote',
    } as unknown as ModuleDefinition

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    registerRemoteModule(remote)
    registerRemoteModule(remote)
    registerRemoteModule({ ...remote, id: 'zz-other' }) // same path as zz-remote

    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn.mock.calls[0]?.[0]).toContain('zz-remote')
    expect(allModules().some((module) => module.id === 'zz-other')).toBe(false)
    warn.mockRestore()

    expect(allModules().filter((module) => module.id === 'zz-remote')).toHaveLength(1)
    expect(allModules().slice(0, modules.length)).toEqual(modules)
    expect(getVisibleModules('l1').map((module) => module.id)).toContain('zz-remote')
    expect(findActiveModule('/remote/zz-remote')?.id).toBe('zz-remote')
  })
})

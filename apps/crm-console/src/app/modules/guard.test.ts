import { describe, expect, it } from 'vitest'
import type { Role, Session } from '@crm/api-client'
import type { ModuleDefinition } from '@/modules/types'
import { requireRemoteModulePermission } from './guard'
import { registerRemoteModule } from './registry'

function args(role: Role, moduleId: string) {
  const session: Session = {
    user: { id: 'u1', name: 'Uji', email: 'uji@example.com', role },
    expiresAt: '2026-12-31T00:00:00.000Z',
  }
  return { context: { session }, params: { moduleId } }
}

describe('requireRemoteModulePermission', () => {
  registerRemoteModule({
    id: 'zz-guarded',
    labelKey: 'zz.title',
    basePath: '/remote/zz-guarded',
    permission: 'case.reassign',
  } as unknown as ModuleDefinition)

  it('redirects a role without the permission the remote module asks for', () => {
    expect(() => requireRemoteModulePermission(args('l1', 'zz-guarded'))).toThrowError()
    expect(() => requireRemoteModulePermission(args('l2', 'zz-guarded'))).toThrowError()
  })

  it('lets a role with the permission through', () => {
    expect(() => requireRemoteModulePermission(args('supervisor', 'zz-guarded'))).not.toThrow()
  })

  it('leaves a module that is not loaded to the page', () => {
    expect(() => requireRemoteModulePermission(args('l1', 'zz-not-loaded'))).not.toThrow()
  })
})

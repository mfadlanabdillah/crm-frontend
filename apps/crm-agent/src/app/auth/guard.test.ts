import { describe, expect, it } from 'vitest'
import type { Role, Session } from '@crm/api-client'
import { requirePermission } from './guard'

function sessionFor(role: Role): { context: { session: Session } } {
  return {
    context: {
      session: {
        user: { id: 'u1', name: 'Uji', email: 'uji@example.com', role },
        expiresAt: '2026-12-31T00:00:00.000Z',
      },
    },
  }
}

describe('requirePermission', () => {
  const guard = requirePermission('customer.view')

  it('mengalihkan peran tanpa izin', () => {
    expect(() => guard(sessionFor('l1'))).toThrowError()
  })

  it('meloloskan peran dengan izin', () => {
    expect(() => guard(sessionFor('l2'))).not.toThrow()
    expect(() => guard(sessionFor('supervisor'))).not.toThrow()
  })
})

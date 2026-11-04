import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { Case } from '@crm/api-client'
import { applyCaseEvent } from './useCaseStream'
import { caseKeys } from './keys'

const event = (occurredAt: string) => ({
  id: 'e1',
  type: 'case.updated' as const,
  caseId: 'c1',
  occurredAt,
  status: 'closed',
})

describe('applyCaseEvent', () => {
  const seed = () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(caseKeys.detail('c1'), {
      id: 'c1',
      status: 'open',
      updatedAt: '2026-01-01T10:00:00Z',
    } as Case)
    return queryClient
  }

  it('applies an event newer than the cached case', () => {
    const queryClient = seed()
    applyCaseEvent(queryClient, event('2026-01-01T11:00:00Z'))
    expect(queryClient.getQueryData<Case>(caseKeys.detail('c1'))?.status).toBe('closed')
  })

  it('drops an event older than the cached case', () => {
    const queryClient = seed()
    applyCaseEvent(queryClient, event('2026-01-01T09:00:00Z'))
    expect(queryClient.getQueryData<Case>(caseKeys.detail('c1'))?.status).toBe('open')
  })
})

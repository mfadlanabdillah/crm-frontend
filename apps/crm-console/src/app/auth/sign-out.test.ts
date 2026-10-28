import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDraftsStore, useWorkspaceStore } from '@/modules/case/public'
import { sessionKey } from '@/lib/query-keys'
import { resetClientState } from './sign-out'

describe('resetClientState', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset()
    useDraftsStore.getState().reset()
  })

  it('membuang seluruh cache query, termasuk modul yang belum dikenal shell', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(sessionKey, { user: { id: 'u1' } })
    queryClient.setQueryData(['cases', 'detail', 'case-1'], { id: 'case-1' })
    queryClient.setQueryData(['customer', 'detail', 'cust-1'], { phone: '081234567890' })
    queryClient.setQueryData(['modul-lain', 'list'], [1, 2, 3])

    resetClientState(queryClient)

    expect(queryClient.getQueryData(sessionKey)).toBeNull()
    expect(queryClient.getQueryData(['cases', 'detail', 'case-1'])).toBeUndefined()
    expect(queryClient.getQueryData(['customer', 'detail', 'cust-1'])).toBeUndefined()
    expect(queryClient.getQueryData(['modul-lain', 'list'])).toBeUndefined()
  })

  it('mengosongkan store workspace modul Case', () => {
    useWorkspaceStore.getState().openTab({ caseId: 'case-1', title: 'CASE-1' })
    expect(useWorkspaceStore.getState().tabs).toHaveLength(1)

    resetClientState(new QueryClient())

    expect(useWorkspaceStore.getState().tabs).toHaveLength(0)
  })

  it('logout membuang draf balasan, sesi habis (expired) menyimpannya', () => {
    const draft = { body: '<p>halo</p>', visibility: 'customer' as const }

    useDraftsStore.getState().setDraft('u1:case-1', draft)
    resetClientState(new QueryClient(), 'expired')
    expect(useDraftsStore.getState().drafts['u1:case-1']).toEqual(draft)

    resetClientState(new QueryClient(), 'logout')
    expect(useDraftsStore.getState().drafts).toEqual({})
  })
})

import { sessionKey } from '@crm/app-kit'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { registerRemoteModule } from '@/app/modules/registry'
import { resetClientState } from './sign-out'

describe('resetClientState', () => {
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

  it('memanggil onSignOut tiap modul dengan alasan keluarnya', () => {
    const onSignOut = vi.fn()
    registerRemoteModule({
      id: 'sign-out-probe',
      labelKey: 'probe.title',
      icon: (() => null) as never,
      basePath: '/sign-out-probe',
      nav: { to: '/' },
      onSignOut,
    })

    resetClientState(new QueryClient(), 'expired')
    resetClientState(new QueryClient(), 'logout')

    expect(onSignOut.mock.calls).toEqual([['expired'], ['logout']])
  })
})

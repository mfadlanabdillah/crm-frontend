import { sessionKey } from '@crm/app-kit'
import { QueryClient } from '@tanstack/react-query'
import type { AnyRouter } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClient as appQueryClient } from '@/lib/query-client'
import { ApiError } from '@crm/api-client'
import { installSessionExpiry } from './session-expiry'

function fakeRouter(pathname: string, href = pathname) {
  const navigate = vi.fn(() => Promise.resolve())
  return {
    router: { navigate, state: { location: { pathname, href } } } as unknown as AnyRouter,
    navigate,
  }
}

describe('installSessionExpiry', () => {
  let uninstall: (() => void) | undefined
  afterEach(() => {
    uninstall?.()
    appQueryClient.clear()
  })

  it('401 membuang cache dan menuju /login dengan redirect ke halaman terakhir', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['cases', 'detail', 'c1'], { id: 'c1' })
    const { router, navigate } = fakeRouter('/cases/c1', '/cases/c1?tab=1')
    uninstall = installSessionExpiry(queryClient, router)

    await appQueryClient
      .fetchQuery({ queryKey: ['x'], queryFn: () => Promise.reject(new ApiError('x', 401)) })
      .catch(() => {})

    expect(queryClient.getQueryData(['cases', 'detail', 'c1'])).toBeUndefined()
    expect(queryClient.getQueryData(sessionKey)).toBeNull()
    expect(navigate).toHaveBeenCalledWith({ to: '/login', search: { redirect: '/cases/c1?tab=1' } })
  })

  it('tidak menavigasi bila sudah di /login', async () => {
    const { router, navigate } = fakeRouter('/login')
    uninstall = installSessionExpiry(new QueryClient(), router)

    await appQueryClient
      .fetchQuery({ queryKey: ['y'], queryFn: () => Promise.reject(new ApiError('x', 401)) })
      .catch(() => {})

    expect(navigate).not.toHaveBeenCalled()
  })

  it('logout di tab lain membawa tab ini ke /login', async () => {
    const { router, navigate } = fakeRouter('/cases')
    uninstall = installSessionExpiry(new QueryClient(), router)

    const other = new BroadcastChannel('crm-auth')
    other.postMessage('signed-out')
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    other.close()
  })
})

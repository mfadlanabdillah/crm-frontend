import { api } from '@crm/app-kit'
import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { sessionQueryOptions } from './session'

describe('sessionQueryOptions', () => {
  afterEach(() => vi.restoreAllMocks())

  it('announces the user it read to other tabs', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue({ user: { id: 'user-b' } } as never)
    const other = new BroadcastChannel('crm-auth')
    const received = new Promise((resolve) => (other.onmessage = (event) => resolve(event.data)))

    await new QueryClient().fetchQuery(sessionQueryOptions)

    expect(await received).toEqual({ type: 'session', userId: 'user-b' })
    other.close()
  })

  it('stays silent when there is no session', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(null)
    const other = new BroadcastChannel('crm-auth')
    const onmessage = vi.fn()
    other.onmessage = onmessage

    expect(await new QueryClient().fetchQuery(sessionQueryOptions)).toBeNull()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(onmessage).not.toHaveBeenCalled()
    other.close()
  })
})

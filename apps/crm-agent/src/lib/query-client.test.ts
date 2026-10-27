import { ApiError } from '@crm/api-client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClient, setUnauthorizedHandler } from './query-client'

const fail = (status: number) => () => Promise.reject(new ApiError('x', status))

describe('queryClient 401', () => {
  afterEach(() => {
    setUnauthorizedHandler(undefined)
    queryClient.clear()
  })

  it('memanggil handler saat query gagal 401', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    await queryClient.fetchQuery({ queryKey: ['a'], queryFn: fail(401) }).catch(() => {})

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('memanggil handler saat mutation gagal 401', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    await queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: fail(401) })
      .execute(undefined)
      .catch(() => {})

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it.each([403, 404, 500])('tidak memanggil handler untuk %i', async (status) => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    await queryClient.fetchQuery({ queryKey: ['b', status], queryFn: fail(status) }).catch(() => {})

    expect(handler).not.toHaveBeenCalled()
  })
})

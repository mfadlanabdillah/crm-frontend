import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient } from './index'

function setup(
  respond: (request: Request) => Response,
  extra: Parameters<typeof createApiClient>[0] | object = {},
) {
  const fetch = vi.fn((request: Request) => Promise.resolve(respond(request)))
  const onError = vi.fn()
  const api = createApiClient({
    baseUrl: 'http://api.test',
    fetch: fetch as unknown as typeof globalThis.fetch,
    getCsrfToken: () => 'csrf-1',
    onError,
    ...extra,
  })
  return { api, fetch, onError }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('createApiClient', () => {
  it('mengirim X-CSRF-Token hanya pada method non-safe', async () => {
    const { api, fetch } = setup(() => json({ id: 'c1' }))

    await api.getCase('c1')
    await api.updateCase('c1', { status: 'closed' })

    const [get, patch] = fetch.mock.calls.map(([request]) => request)
    expect(get?.headers.get('X-CSRF-Token')).toBeNull()
    expect(patch?.headers.get('X-CSRF-Token')).toBe('csrf-1')
    expect(get?.headers.get('Accept')).toBe('application/json')
  })

  it('mengirim cookie sesi (credentials: include)', async () => {
    const { api, fetch } = setup(() => json({ id: 'c1' }))
    await api.getCase('c1')
    expect(fetch.mock.calls[0]?.[0].credentials).toBe('include')
  })

  it('createCase posts the body with the CSRF token and returns the created case', async () => {
    const { api, fetch } = setup((request) => {
      expect(request.method).toBe('POST')
      return json({ id: 'case-1' }, 201)
    })

    const created = await api.createCase({ subject: 'Lost parcel', priority: 'high', queue: 'l1' })

    const request = fetch.mock.calls[0]?.[0]
    expect(created).toEqual({ id: 'case-1' })
    expect(request?.headers.get('X-CSRF-Token')).toBe('csrf-1')
    expect(await request?.clone().json()).toEqual({
      subject: 'Lost parcel',
      priority: 'high',
      queue: 'l1',
    })
  })

  it('getSession mengembalikan null pada 401 tanpa melempar atau memanggil onError', async () => {
    const { api, onError } = setup(() => json({ code: 'unauthorized' }, 401))
    await expect(api.getSession()).resolves.toBeNull()
    expect(onError).not.toHaveBeenCalled()
  })

  it('memetakan error server ke ApiError lengkap dengan requestId', async () => {
    const { api, onError } = setup(() =>
      json({ code: 'forbidden', message: 'Role tidak boleh', requestId: 'req-9' }, 403),
    )

    const error = await api.getCase('c1').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 403,
      code: 'forbidden',
      message: 'Role tidak boleh',
      requestId: 'req-9',
    })
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('memakai pesan bawaan bila server tidak mengirim message', async () => {
    const { api } = setup(() => json({}, 500))
    await expect(api.getCase('c1')).rejects.toMatchObject({
      status: 500,
      code: 'unknown',
      message: 'Permintaan gagal (HTTP 500)',
    })
  })

  it('menolak respons 200 tanpa body sebagai empty_response', async () => {
    const { api } = setup(() => new Response(null, { status: 200 }))
    await expect(api.getCase('c1')).rejects.toMatchObject({ code: 'empty_response' })
  })

  it('logout melempar ApiError bila server menolak', async () => {
    const { api, onError } = setup(() => json({ code: 'unauthorized' }, 401))
    await expect(api.logout()).rejects.toBeInstanceOf(ApiError)
    expect(onError).toHaveBeenCalledTimes(1)
  })
})

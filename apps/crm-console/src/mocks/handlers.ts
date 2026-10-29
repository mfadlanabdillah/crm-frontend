import { env } from '@crm/app-kit'
import { HttpResponse, http } from 'msw'
import type { Role } from '@crm/api-client'
import { createDomainHandlers } from '@crm/mock-domain'
import { db } from './db'

function jsonError(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status })
}

function unauthorized() {
  return jsonError(401, 'unauthorized', 'Sesi tidak ditemukan atau sudah kedaluwarsa')
}

export const handlers = [
  http.get('/v1/session', () => {
    const session = db.getSession()
    return session ? HttpResponse.json(session) : unauthorized()
  }),

  http.post('/v1/dev/session', async ({ request }) => {
    if (!env.mocksEnabled) {
      return jsonError(404, 'not_found', 'Endpoint mock tidak aktif')
    }
    const body = (await request.json()) as { role?: Role }
    const role: Role =
      body.role === 'l1' ||
      body.role === 'l2' ||
      body.role === 'supervisor' ||
      body.role === 'admin'
        ? body.role
        : 'supervisor'
    return HttpResponse.json(db.setSession(role))
  }),

  http.post('/v1/auth/logout', () => {
    db.setSession(null)
    return new HttpResponse(null, { status: 204 })
  }),

  // The domain (cases, customers, ...) is not part of the boilerplate: `@crm/mock-domain` is empty
  // unless MOCK_DOMAIN points at one (see vite.config.ts).
  ...createDomainHandlers({ getSession: () => db.getSession() }),
]

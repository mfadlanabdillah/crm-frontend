import { HttpResponse, delay, http } from 'msw'
import { can } from '@crm/auth'
import type {
  CaseListQuery,
  CaseStatus,
  CreateCaseRequest,
  CreateReplyRequest,
  CustomerListQuery,
  DecideRefundRequest,
  Queue,
  RefundListQuery,
  Role,
  UpdateCaseRequest,
} from '@crm/api-client'
import { env } from '@/lib/env'
import { MASTER_DATA, db } from './db'
import { maskCaseForRole, maskCustomerForRole } from './mask'

const NETWORK_DELAY_MS = 120

function jsonError(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status })
}

function unauthorized() {
  return jsonError(401, 'unauthorized', 'Sesi tidak ditemukan atau sudah kedaluwarsa')
}

function requireSession() {
  return db.getSession()
}

export const handlers = [
  http.get('/v1/session', () => {
    const session = requireSession()
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

  http.get('/v1/master-data', async () => {
    await delay(NETWORK_DELAY_MS)
    if (!requireSession()) return unauthorized()
    return HttpResponse.json(MASTER_DATA)
  }),

  http.get('/v1/cases/summary', async () => {
    await delay(NETWORK_DELAY_MS)
    if (!requireSession()) return unauthorized()
    return HttpResponse.json(db.getSummary())
  }),

  http.post('/v1/cases', async ({ request }) => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()
    if (!can(session.user.role, 'case.create')) {
      return jsonError(403, 'forbidden', 'Role Anda tidak boleh membuat case')
    }

    const body = (await request.json()) as CreateCaseRequest
    if (typeof body.subject !== 'string' || body.subject.trim().length < 3) {
      return jsonError(422, 'validation_error', 'Subjek minimal 3 karakter')
    }

    const created = db.addCase(body, session.user)
    return HttpResponse.json(maskCaseForRole(created, session.user.role), { status: 201 })
  }),

  http.get('/v1/cases', async ({ request }) => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()

    const url = new URL(request.url)
    const query: CaseListQuery = {
      view: (url.searchParams.get('view') as CaseListQuery['view']) ?? 'all',
      sort: (url.searchParams.get('sort') as CaseListQuery['sort']) ?? '-updated_at',
      page: Number(url.searchParams.get('page') ?? 1),
      page_size: Number(url.searchParams.get('page_size') ?? 25),
      ...(url.searchParams.get('status')
        ? { status: url.searchParams.get('status') as CaseStatus }
        : {}),
      ...(url.searchParams.get('queue') ? { queue: url.searchParams.get('queue') as Queue } : {}),
      ...(url.searchParams.get('customerId')
        ? { customerId: url.searchParams.get('customerId') ?? undefined }
        : {}),
      ...(url.searchParams.get('q') ? { q: url.searchParams.get('q') ?? undefined } : {}),
    }

    const result = db.listCases(query)
    return HttpResponse.json({
      ...result,
      items: result.items.map((item) => maskCaseForRole(item, session.user.role)),
    })
  }),

  http.get('/v1/cases/:caseId', async ({ params }) => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()

    const item = db.getCase(String(params.caseId))
    return item
      ? HttpResponse.json(maskCaseForRole(item, session.user.role))
      : jsonError(404, 'not_found', 'Case tidak ditemukan')
  }),

  http.get('/v1/customers', async ({ request }) => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()
    if (!can(session.user.role, 'customer.view')) {
      return jsonError(403, 'forbidden', 'Role Anda tidak boleh melihat customer')
    }

    const url = new URL(request.url)
    const query: CustomerListQuery = {
      page: Number(url.searchParams.get('page') ?? 1),
      page_size: Number(url.searchParams.get('page_size') ?? 25),
      ...(url.searchParams.get('q') ? { q: url.searchParams.get('q') ?? undefined } : {}),
    }
    const result = db.listCustomers(query)
    return HttpResponse.json({
      ...result,
      items: result.items.map((item) => maskCustomerForRole(item, session.user.role)),
    })
  }),

  http.get('/v1/customers/:customerId', async ({ params }) => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()
    if (!can(session.user.role, 'customer.view')) {
      return jsonError(403, 'forbidden', 'Role Anda tidak boleh melihat customer')
    }

    const item = db.getCustomer(String(params.customerId))
    return item
      ? HttpResponse.json(maskCustomerForRole(item, session.user.role))
      : jsonError(404, 'not_found', 'Customer tidak ditemukan')
  }),

  http.patch('/v1/cases/:caseId', async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()

    const patch = (await request.json()) as UpdateCaseRequest
    const role = session.user.role

    if (patch.assigneeId !== undefined && !can(role, 'case.assign')) {
      return jsonError(403, 'forbidden', 'Role Anda tidak boleh mengubah PIC')
    }
    if (patch.status && !can(role, 'case.status.update')) {
      return jsonError(403, 'forbidden', 'Role Anda tidak boleh mengubah status')
    }
    if (patch.queue && !can(role, 'case.escalate')) {
      return jsonError(403, 'forbidden', 'Role Anda tidak boleh memindahkan antrean')
    }

    const updated = db.updateCase(String(params.caseId), patch, session.user)
    return updated
      ? HttpResponse.json(maskCaseForRole(updated, role))
      : jsonError(404, 'not_found', 'Case tidak ditemukan')
  }),

  // Finance PoC: mock-only domain (Proposed in docs/contract-status.md). `case.export` stands in for
  // a Finance permission, which is a business decision.
  http.get('/v1/finance/refunds', async ({ request }) => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()
    if (!can(session.user.role, 'case.export')) {
      return jsonError(403, 'forbidden', 'Role Anda tidak boleh melihat refund')
    }

    const url = new URL(request.url)
    const query: RefundListQuery = {
      page: Number(url.searchParams.get('page') ?? 1),
      page_size: Number(url.searchParams.get('page_size') ?? 25),
      ...(url.searchParams.get('status')
        ? { status: url.searchParams.get('status') ?? undefined }
        : {}),
    }
    return HttpResponse.json(db.listRefunds(query))
  }),

  http.patch('/v1/finance/refunds/:refundId', async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()
    if (!can(session.user.role, 'case.export')) {
      return jsonError(403, 'forbidden', 'Role Anda tidak boleh memutuskan refund')
    }

    const body = (await request.json()) as DecideRefundRequest
    if (body.decision !== 'approved' && body.decision !== 'rejected') {
      return jsonError(422, 'validation_error', 'Keputusan harus approved atau rejected')
    }
    if (!body.note || body.note.trim().length < 3) {
      return jsonError(422, 'validation_error', 'Catatan minimal 3 karakter')
    }

    const result = db.decideRefund(String(params.refundId), body, session.user)
    if ('error' in result) {
      return result.error === 'not_found'
        ? jsonError(404, 'not_found', 'Refund tidak ditemukan')
        : jsonError(409, 'already_decided', 'Refund sudah diputuskan')
    }
    return HttpResponse.json(result.refund)
  }),

  http.post('/v1/cases/:caseId/replies', async ({ params, request }) => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()

    const body = (await request.json()) as CreateReplyRequest
    if (!body.body || body.body.trim().length === 0) {
      return jsonError(422, 'validation_error', 'Balasan tidak boleh kosong')
    }

    const permission = body.visibility === 'internal' ? 'case.note.internal' : 'case.reply'
    if (!can(session.user.role, permission)) {
      return jsonError(403, 'forbidden', 'Role Anda tidak boleh mengirim balasan ini')
    }

    const entry = db.addReply(String(params.caseId), body, session.user)
    return entry
      ? HttpResponse.json(entry, { status: 201 })
      : jsonError(404, 'not_found', 'Case tidak ditemukan')
  }),
]

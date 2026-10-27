import createClient from 'openapi-fetch'
import type { components, paths } from './generated/openapi'

export type Session = components['schemas']['Session']
export type User = components['schemas']['User']
export type Role = components['schemas']['Role']
export type Case = components['schemas']['Case']
export type CaseStatus = components['schemas']['CaseStatus']
export type CasePriority = components['schemas']['Priority']
export type CaseQueue = components['schemas']['Queue']
export type Queue = components['schemas']['Queue']
export type Customer = components['schemas']['Customer']
export type TimelineEntry = components['schemas']['TimelineEntry']
export type CaseListResponse = components['schemas']['CaseListResponse']
export type CaseSummary = components['schemas']['CaseSummary']
export type MasterData = components['schemas']['MasterData']
export type MasterDataItem = components['schemas']['MasterDataItem']
export type UpdateCaseRequest = components['schemas']['UpdateCaseRequest']
export type CreateReplyRequest = components['schemas']['CreateReplyRequest']
export type CaseEvent = components['schemas']['CaseEvent']

export type CustomerProfile = components['schemas']['CustomerProfile']
export type CustomerSegment = components['schemas']['CustomerSegment']
export type CustomerListResponse = components['schemas']['CustomerListResponse']
export type CustomerListQuery = NonNullable<paths['/v1/customers']['get']['parameters']['query']>

export type CaseListQuery = NonNullable<paths['/v1/cases']['get']['parameters']['query']>

export interface ApiClientOptions {
  /** Same-origin base URL, contoh `/`. Jangan pernah mengarah langsung ke backend. */
  baseUrl: string
  /** Override fetch (dipakai test dan MSW). */
  fetch?: typeof globalThis.fetch
  /** Baca token double-submit CSRF dari cookie non-HttpOnly. */
  getCsrfToken?: () => string | null | undefined
  /** Dipanggil untuk setiap respons non-2xx sebelum error dilempar. */
  onError?: (error: ApiError) => void
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId: string | undefined

  constructor(message: string, status: number, code = 'unknown', requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

interface OpenApiResult<T> {
  data?: T
  error?: unknown
  response: Response
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function isErrorPayload(
  value: unknown,
): value is { code?: string; message?: string; requestId?: string } {
  return typeof value === 'object' && value !== null
}

function toApiError(response: Response, payload: unknown): ApiError {
  const body = isErrorPayload(payload) ? payload : {}
  const message =
    typeof body.message === 'string' && body.message.length > 0
      ? body.message
      : `Permintaan gagal (HTTP ${response.status})`
  return new ApiError(message, response.status, body.code ?? 'unknown', body.requestId)
}

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, fetch, getCsrfToken, onError } = options

  const client = createClient<paths>({
    baseUrl,
    credentials: 'include',
    ...(fetch ? { fetch } : {}),
  })

  client.use({
    onRequest({ request }) {
      if (!SAFE_METHODS.has(request.method.toUpperCase())) {
        const token = getCsrfToken?.()
        if (token) request.headers.set('X-CSRF-Token', token)
      }
      request.headers.set('Accept', 'application/json')
      return request
    },
  })

  async function unwrap<T>(result: Promise<OpenApiResult<T>>): Promise<T> {
    const { data, error, response } = await result
    if (!response.ok) {
      const apiError = toApiError(response, error)
      onError?.(apiError)
      throw apiError
    }
    if (data === undefined) {
      const apiError = new ApiError('Respons kosong dari server', response.status, 'empty_response')
      onError?.(apiError)
      throw apiError
    }
    return data
  }

  return {
    /** Null berarti belum login (401), bukan error yang perlu ditampilkan. */
    async getSession(): Promise<Session | null> {
      const result = await client.GET('/v1/session')
      if (result.response.status === 401) return null
      return unwrap(Promise.resolve(result))
    },

    async logout(): Promise<void> {
      const { response, error } = await client.POST('/v1/auth/logout')
      if (!response.ok) {
        const apiError = toApiError(response, error)
        onError?.(apiError)
        throw apiError
      }
    },

    listCases(query: CaseListQuery, signal?: AbortSignal): Promise<CaseListResponse> {
      return unwrap(client.GET('/v1/cases', { params: { query }, ...(signal ? { signal } : {}) }))
    },

    getMasterData(signal?: AbortSignal): Promise<MasterData> {
      return unwrap(client.GET('/v1/master-data', signal ? { signal } : {}))
    },

    getCaseSummary(signal?: AbortSignal): Promise<CaseSummary> {
      return unwrap(client.GET('/v1/cases/summary', signal ? { signal } : {}))
    },

    getCase(caseId: string, signal?: AbortSignal): Promise<Case> {
      return unwrap(
        client.GET('/v1/cases/{caseId}', {
          params: { path: { caseId } },
          ...(signal ? { signal } : {}),
        }),
      )
    },

    listCustomers(query: CustomerListQuery, signal?: AbortSignal): Promise<CustomerListResponse> {
      return unwrap(
        client.GET('/v1/customers', { params: { query }, ...(signal ? { signal } : {}) }),
      )
    },

    getCustomer(customerId: string, signal?: AbortSignal): Promise<CustomerProfile> {
      return unwrap(
        client.GET('/v1/customers/{customerId}', {
          params: { path: { customerId } },
          ...(signal ? { signal } : {}),
        }),
      )
    },

    updateCase(caseId: string, patch: UpdateCaseRequest): Promise<Case> {
      return unwrap(
        client.PATCH('/v1/cases/{caseId}', {
          params: { path: { caseId } },
          body: patch,
        }),
      )
    },

    createReply(caseId: string, reply: CreateReplyRequest): Promise<TimelineEntry> {
      return unwrap(
        client.POST('/v1/cases/{caseId}/replies', {
          params: { path: { caseId } },
          body: reply,
        }),
      )
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

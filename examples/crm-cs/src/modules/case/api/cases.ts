import { api } from '@crm/app-kit'
import type {
  CaseListQuery,
  CreateCaseRequest,
  CreateReplyRequest,
  UpdateCaseRequest,
} from '@crm/api-client'

/**
 * Semua akses case lewat facade ini. Komponen tidak boleh memanggil `fetch`
 * atau `api` langsung, supaya tipe dan penanganan error tetap seragam.
 */
export const casesApi = {
  list: (query: CaseListQuery, signal?: AbortSignal) => api.listCases(query, signal),
  masterData: (signal?: AbortSignal) => api.getMasterData(signal),
  summary: (signal?: AbortSignal) => api.getCaseSummary(signal),
  detail: (caseId: string, signal?: AbortSignal) => api.getCase(caseId, signal),
  create: (body: CreateCaseRequest) => api.createCase(body),
  update: (caseId: string, patch: UpdateCaseRequest) => api.updateCase(caseId, patch),
  reply: (caseId: string, body: CreateReplyRequest) => api.createReply(caseId, body),
}

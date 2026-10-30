import { z } from 'zod'
import type { CaseListQuery } from '@crm/api-client'

export const CASE_VIEWS = ['all', 'mine', 'unassigned'] as const
export const CASE_SORTS = [
  '-updated_at',
  'updated_at',
  '-created_at',
  'created_at',
  '-priority',
] as const

/**
 * Sumber kebenaran filter ada di URL, bukan di state komponen.
 * `.catch()` membuat URL yang di-bookmark tetap bisa dibuka walau formatnya usang.
 */
export const caseSearchSchema = z.object({
  // Kode status/antrean berasal dari master data API; nilai usang ditangani server.
  status: z.string().min(1).max(40).optional().catch(undefined),
  queue: z.string().min(1).max(40).optional().catch(undefined),
  view: z.enum(CASE_VIEWS).default('all').catch('all'),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .catch(undefined)
    .transform((value) => (value === '' ? undefined : value)),
  sort: z.enum(CASE_SORTS).default('-updated_at').catch('-updated_at'),
  // Case open in the preview panel; kept in the URL so a reload or shared link reopens it.
  preview: z.string().min(1).max(64).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25).catch(25),
})

export type CaseSearch = z.infer<typeof caseSearchSchema>

export const DEFAULT_CASE_SEARCH: CaseSearch = caseSearchSchema.parse({})

/** Normalisasi search router menjadi query API (snake_case, tanpa undefined). */
export function toCaseListQuery(search: CaseSearch): CaseListQuery {
  return {
    view: search.view,
    sort: search.sort,
    page: search.page,
    page_size: search.pageSize,
    ...(search.status ? { status: search.status } : {}),
    ...(search.queue ? { queue: search.queue } : {}),
    ...(search.q ? { q: search.q } : {}),
  }
}

/** Setiap perubahan filter kembali ke halaman 1, kecuali yang menyebut page. */
export function updateCaseSearch(search: CaseSearch, patch: Partial<CaseSearch>): CaseSearch {
  return { ...search, ...patch, page: patch.page ?? 1 }
}

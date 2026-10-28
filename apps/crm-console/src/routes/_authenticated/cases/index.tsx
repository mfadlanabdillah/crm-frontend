import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CaseListPage } from '@/modules/case/pages/CaseListPage'
import { DEFAULT_CASE_SEARCH, caseSearchSchema } from '@/modules/case/schemas/search'
import type { CaseSearch } from '@/modules/case/schemas/search'

export const Route = createFileRoute('/_authenticated/cases/')({
  validateSearch: (search: Record<string, unknown>): CaseSearch => caseSearchSchema.parse(search),
  // URL tetap ringkas: default tidak ikut ditulis kecuali agen mengubahnya.
  search: { middlewares: [stripSearchParams(DEFAULT_CASE_SEARCH)] },
  component: CaseListPage,
})

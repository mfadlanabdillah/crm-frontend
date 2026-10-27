import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { caseKeys } from '@/lib/query-keys'
import { casesApi } from '../api/cases'
import { toCaseListQuery } from '../schemas/search'
import type { CaseSearch } from '../schemas/search'

export function caseListQueryOptions(search: CaseSearch) {
  return queryOptions({
    queryKey: caseKeys.list(search),
    queryFn: ({ signal }) => casesApi.list(toCaseListQuery(search), signal),
    // Pindah halaman/filter tidak mengosongkan tabel; data lama tetap tampil
    // sampai data baru siap (mencegah layout shift saat sesi panjang).
    placeholderData: keepPreviousData,
  })
}

export function useCases(search: CaseSearch) {
  return useQuery(caseListQueryOptions(search))
}

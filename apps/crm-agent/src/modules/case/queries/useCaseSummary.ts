import { queryOptions, useQuery } from '@tanstack/react-query'
import { caseKeys } from '@/lib/query-keys'
import { casesApi } from '../api/cases'

export function caseSummaryQueryOptions() {
  return queryOptions({
    queryKey: caseKeys.summary(),
    queryFn: ({ signal }) => casesApi.summary(signal),
    staleTime: 60_000,
  })
}

export function useCaseSummary() {
  return useQuery(caseSummaryQueryOptions())
}

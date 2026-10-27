import { queryOptions, useQuery } from '@tanstack/react-query'
import { caseKeys } from '@/lib/query-keys'
import { casesApi } from '../api/cases'

export function caseQueryOptions(caseId: string) {
  return queryOptions({
    queryKey: caseKeys.detail(caseId),
    queryFn: ({ signal }) => casesApi.detail(caseId, signal),
  })
}

export function useCase(caseId: string) {
  return useQuery(caseQueryOptions(caseId))
}

import { queryOptions, useQuery } from '@tanstack/react-query'
import type { MasterDataItem } from '@crm/api-client'
import { masterDataKey } from '@/lib/query-keys'
import { casesApi } from '../api/cases'

export function masterDataQueryOptions() {
  return queryOptions({
    queryKey: masterDataKey,
    queryFn: ({ signal }) => casesApi.masterData(signal),
    staleTime: 10 * 60_000,
  })
}

export function useMasterData() {
  return useQuery(masterDataQueryOptions())
}

export function findMasterItem(items: MasterDataItem[] | undefined, code: string) {
  return items?.find((item) => item.code === code)
}

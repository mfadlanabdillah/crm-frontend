import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { customerApi } from '@/modules/customer/api/customer'
import { customerKeys } from '@/modules/customer/queries/keys'
import { toCustomerListQuery } from '@/modules/customer/schemas/search'
import type { CustomerSearch } from '@/modules/customer/schemas/search'

export function customerListQueryOptions(search: CustomerSearch) {
  return queryOptions({
    queryKey: customerKeys.list(search),
    queryFn: ({ signal }) => customerApi.list(toCustomerListQuery(search), signal),
    placeholderData: keepPreviousData,
  })
}

export function useCustomers(search: CustomerSearch) {
  return useQuery(customerListQueryOptions(search))
}

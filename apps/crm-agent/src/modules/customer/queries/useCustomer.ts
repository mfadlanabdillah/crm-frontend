import { queryOptions, useQuery } from '@tanstack/react-query'
import { customerApi } from '@/modules/customer/api/customer'
import { customerKeys } from '@/modules/customer/queries/keys'

export function customerQueryOptions(customerId: string) {
  return queryOptions({
    queryKey: customerKeys.detail(customerId),
    queryFn: ({ signal }) => customerApi.detail(customerId, signal),
  })
}

export function useCustomer(customerId: string) {
  return useQuery(customerQueryOptions(customerId))
}

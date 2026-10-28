import { queryOptions, useQuery } from '@tanstack/react-query'
import { customerApi } from '@/modules/customer/api/customer'
import { customerKeys } from '@/modules/customer/queries/keys'

export function customerCasesQueryOptions(customerId: string) {
  return queryOptions({
    queryKey: customerKeys.cases(customerId),
    queryFn: ({ signal }) => customerApi.cases(customerId, signal),
  })
}

export function useCustomerCases(customerId: string) {
  return useQuery(customerCasesQueryOptions(customerId))
}

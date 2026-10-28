import type { CustomerListQuery } from '@crm/api-client'
import { api } from '@/lib/api'

/**
 * Semua akses customer lewat facade ini. Komponen tidak memanggil `fetch` atau `api` langsung.
 */
export const customerApi = {
  list: (query: CustomerListQuery, signal?: AbortSignal) => api.listCustomers(query, signal),
  detail: (customerId: string, signal?: AbortSignal) => api.getCustomer(customerId, signal),
  cases: (customerId: string, signal?: AbortSignal) =>
    api.listCases({ customerId, page_size: 10, sort: '-created_at' }, signal),
}

import { z } from 'zod'
import type { CustomerListQuery } from '@crm/api-client'

/** Filter hidup di URL; `.catch()` membuat URL usang tetap bisa dibuka. */
export const customerSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .catch(undefined)
    .transform((value) => (value === '' ? undefined : value)),
  page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
})

export type CustomerSearch = z.infer<typeof customerSearchSchema>

export const DEFAULT_CUSTOMER_SEARCH: CustomerSearch = customerSearchSchema.parse({})

export const CUSTOMER_PAGE_SIZE = 25

export function toCustomerListQuery(search: CustomerSearch): CustomerListQuery {
  return {
    page: search.page,
    page_size: CUSTOMER_PAGE_SIZE,
    ...(search.q ? { q: search.q } : {}),
  }
}

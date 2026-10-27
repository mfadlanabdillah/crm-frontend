import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { requirePermission } from '@/app/auth/guard'
import { CustomerListPage } from '@/modules/customer/pages/CustomerListPage'
import { DEFAULT_CUSTOMER_SEARCH, customerSearchSchema } from '@/modules/customer/schemas/search'
import type { CustomerSearch } from '@/modules/customer/schemas/search'

export const Route = createFileRoute('/_authenticated/customers/')({
  beforeLoad: requirePermission('customer.view'),
  validateSearch: (search: Record<string, unknown>): CustomerSearch =>
    customerSearchSchema.parse(search),
  // URL tetap ringkas: default tidak ikut ditulis.
  search: { middlewares: [stripSearchParams(DEFAULT_CUSTOMER_SEARCH)] },
  component: CustomerListPage,
})

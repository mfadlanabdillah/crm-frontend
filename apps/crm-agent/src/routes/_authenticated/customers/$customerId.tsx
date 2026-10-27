import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/app/auth/guard'
import { CustomerDetailPage } from '@/modules/customer/pages/CustomerDetailPage'

export const Route = createFileRoute('/_authenticated/customers/$customerId')({
  beforeLoad: requirePermission('customer.view'),
  component: CustomerDetailPage,
})

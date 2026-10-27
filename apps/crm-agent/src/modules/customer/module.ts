import { UsersRound } from 'lucide-react'
import type { ModuleDefinition } from '@/modules/types'
import { DEFAULT_CUSTOMER_SEARCH } from '@/modules/customer/schemas/search'

export const customerModule: ModuleDefinition = {
  id: 'customer',
  labelKey: 'customer.title',
  icon: UsersRound,
  basePath: '/customers',
  nav: { to: '/customers', search: DEFAULT_CUSTOMER_SEARCH },
  permission: 'customer.view',
}

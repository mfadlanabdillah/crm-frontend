import { UsersRound } from 'lucide-react'
import type { RemoteModule } from '@crm/module-contract'
import { DEFAULT_CUSTOMER_SEARCH } from '@/modules/customer/schemas/search'

export const customerModule: RemoteModule = {
  id: 'customer',
  labelKey: 'customer.title',
  icon: UsersRound,
  basePath: '/customers',
  nav: { to: '/customers', search: DEFAULT_CUSTOMER_SEARCH },
  permission: 'customer.view',
}

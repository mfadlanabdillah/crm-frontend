import { requirePermission } from '@crm/app-kit'
import { createRoute, stripSearchParams } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { CaseCreatePage } from '@/modules/case/pages/CaseCreatePage'
import { CaseDetailPage } from '@/modules/case/pages/CaseDetailPage'
import { CaseListPage } from '@/modules/case/pages/CaseListPage'
import { DEFAULT_CASE_SEARCH, caseSearchSchema } from '@/modules/case/schemas/search'
import { CustomerDetailPage } from '@/modules/customer/pages/CustomerDetailPage'
import { CustomerListPage } from '@/modules/customer/pages/CustomerListPage'
import { DEFAULT_CUSTOMER_SEARCH, customerSearchSchema } from '@/modules/customer/schemas/search'

/**
 * Routes of this remote, added under the host's `/_authenticated` layout route. Ids must stay
 * `/_authenticated/<path>`: the pages look their route up with `getRouteApi` by that id.
 */
export function createRoutes(parent: AnyRoute): AnyRoute[] {
  return [
    createRoute({
      getParentRoute: () => parent,
      path: 'cases',
      validateSearch: (search: Record<string, unknown>) => caseSearchSchema.parse(search),
      // The URL stays short: defaults are not written.
      search: { middlewares: [stripSearchParams(DEFAULT_CASE_SEARCH)] },
      component: CaseListPage,
    }),
    createRoute({
      getParentRoute: () => parent,
      path: 'cases/new',
      beforeLoad: requirePermission('case.create'),
      component: CaseCreatePage,
    }),
    createRoute({
      getParentRoute: () => parent,
      path: 'cases/$caseId',
      component: CaseDetailPage,
    }),
    createRoute({
      getParentRoute: () => parent,
      path: 'customers',
      beforeLoad: requirePermission('customer.view'),
      validateSearch: (search: Record<string, unknown>) => customerSearchSchema.parse(search),
      search: { middlewares: [stripSearchParams(DEFAULT_CUSTOMER_SEARCH)] },
      component: CustomerListPage,
    }),
    createRoute({
      getParentRoute: () => parent,
      path: 'customers/$customerId',
      beforeLoad: requirePermission('customer.view'),
      component: CustomerDetailPage,
    }),
  ]
}

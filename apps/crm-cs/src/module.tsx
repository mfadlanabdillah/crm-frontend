import type { RemoteModule } from '@crm/module-contract'
import { caseModule } from '@/modules/case/module'
import { customerModule } from '@/modules/customer/module'
import { createRoutes } from './routes'

// One app, two menus. The first module carries the routes of both.
const modules: RemoteModule[] = [{ ...caseModule, routes: createRoutes }, customerModule]

export default modules

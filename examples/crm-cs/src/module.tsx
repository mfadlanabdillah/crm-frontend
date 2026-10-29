import type { RemoteModule } from '@crm/module-contract'
import { caseModule } from '@/modules/case/module'
import { customerModule } from '@/modules/customer/module'
import { createRoutes } from './routes'
import { registerTexts } from './texts'

registerTexts()

// One app, two menus. The first module carries the routes of both.
const modules: RemoteModule[] = [{ ...caseModule, routes: createRoutes }, customerModule]

export default modules

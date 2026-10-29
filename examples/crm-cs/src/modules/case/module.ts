import { LifeBuoy } from 'lucide-react'
import type { RemoteModule } from '@crm/module-contract'
import { QueueNav } from '@/modules/case/components/QueueNav'
import { WorkspaceTabs } from '@/modules/case/components/WorkspaceTabs'
import { useCaseStream } from '@/modules/case/queries/useCaseStream'
import { DEFAULT_CASE_SEARCH } from '@/modules/case/schemas/search'
import { useDraftsStore } from '@/modules/case/store/drafts'
import { useWorkspaceStore } from '@/modules/case/store/workspace'

export const caseModule: RemoteModule = {
  id: 'case',
  labelKey: 'cases.title',
  icon: LifeBuoy,
  basePath: '/cases',
  nav: { to: '/cases', search: DEFAULT_CASE_SEARCH },
  permission: 'case.view',
  Sidebar: QueueNav,
  Tabs: WorkspaceTabs,
  useRealtime: useCaseStream,
  onSignOut: (reason) => {
    useWorkspaceStore.getState().reset()
    if (reason === 'logout') useDraftsStore.getState().reset()
  },
}

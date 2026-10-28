import type { CasePriority, CaseStatus, MasterDataItem } from '@crm/api-client'
import { Badge } from '@crm/ui'
import { findMasterItem, useMasterData } from '@/modules/case/queries/useMasterData'

function MasterBadge({ item, code }: { item: MasterDataItem | undefined; code: string }) {
  return <Badge tone={item?.tone ?? 'neutral'}>{item?.label ?? code}</Badge>
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const { data } = useMasterData()
  return <MasterBadge item={findMasterItem(data?.statuses, status)} code={status} />
}

export function CasePriorityBadge({ priority }: { priority: CasePriority }) {
  const { data } = useMasterData()
  return <MasterBadge item={findMasterItem(data?.priorities, priority)} code={priority} />
}

import { createFileRoute } from '@tanstack/react-router'
import { requireRemoteModulePermission } from '@/app/modules/guard'
import { RemoteModulePage } from '@/app/modules/RemoteModulePage'

export const Route = createFileRoute('/_authenticated/remote/$moduleId/')({
  beforeLoad: requireRemoteModulePermission,
  component: RemoteRoot,
})

function RemoteRoot() {
  const { moduleId } = Route.useParams()
  return <RemoteModulePage moduleId={moduleId} subPath="" />
}

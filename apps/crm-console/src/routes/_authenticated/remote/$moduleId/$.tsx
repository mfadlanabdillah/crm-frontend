import { createFileRoute, useLocation, useParams } from '@tanstack/react-router'
import { requireRemoteModulePermission } from '@/app/modules/guard'
import { RemoteModulePage } from '@/app/modules/RemoteModulePage'

export const Route = createFileRoute('/_authenticated/remote/$moduleId/$')({
  beforeLoad: requireRemoteModulePermission,
  component: RemoteSubPath,
})

function RemoteSubPath() {
  const { moduleId = '' } = useParams({ strict: false })
  const pathname = useLocation({ select: (location) => location.pathname })
  // `/remote/<id>/a/b` -> `a/b`. Read from the pathname: this router version does not type the splat.
  const subPath = pathname.split('/').slice(3).map(decodeURIComponent).join('/')
  return <RemoteModulePage moduleId={moduleId} subPath={subPath} />
}

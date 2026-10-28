import { createFileRoute } from '@tanstack/react-router'
import { RemoteModulePage } from '@/app/modules/RemoteModulePage'

export const Route = createFileRoute('/_authenticated/remote/$moduleId')({
  component: RemoteRoute,
})

function RemoteRoute() {
  const { moduleId } = Route.useParams()
  return <RemoteModulePage moduleId={moduleId} />
}

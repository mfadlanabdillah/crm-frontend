import { can } from '@crm/auth'
import type { Session } from '@crm/api-client'
import { redirect } from '@tanstack/react-router'
import { allModules } from '@/app/modules/registry'

/**
 * `beforeLoad` for the generic remote routes. Unlike `requirePermission`, the permission is not
 * known when the route is written: it comes from the module the remote exposed. A module that is
 * not loaded is left to the page, which says it is unavailable. The UI only hides; the backend
 * stays the last line of defense.
 */
export function requireRemoteModulePermission({
  context,
  params,
}: {
  context: { session: Session }
  params: { moduleId: string }
}) {
  const permission = allModules().find((module) => module.id === params.moduleId)?.permission
  if (permission && !can(context.session.user.role, permission)) {
    throw redirect({ to: '/' })
  }
}

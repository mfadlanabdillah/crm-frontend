/**
 * Contract between the host (`apps/crm-console`) and a micro frontend remote. Types only: import with
 * `import type`, so nothing from this package ends up in a bundle or needs to be a shared singleton.
 * Changing it is a breaking change for every remote.
 */
import type { ApiClient } from '@crm/api-client'
import type { Permission } from '@crm/auth'
import type { ComponentType } from 'react'

/** What the host hands to a remote's page. */
export interface RemotePageProps {
  /** The host's API client: same session, CSRF handling, and 401 handling as built-in modules. */
  api: ApiClient
  /** Path below `/remote/<id>/` without a leading slash; empty for the module root. */
  subPath: string
  /** Moves to `/remote/<id>/<subPath>` inside the host router (no page reload). */
  navigate: (subPath: string) => void
  /**
   * Opens a path of the host app (for example `/cases/case-00001` or `/cases?queue=escalated`)
   * without a page reload. Only internal paths are accepted; anything else is ignored.
   */
  openHostPath: (path: string) => void
}

/** What a remote exposes as `./module` (default export). */
export interface RemoteModule {
  /** Unique across the host and every remote. */
  id: string
  /** i18n key of the module name; the remote adds its own texts under its id. */
  labelKey: string
  icon: ComponentType<{ className?: string }>
  /** Always `/remote/<id>`. */
  basePath: string
  /** Sidebar link target: `{ to: '/remote/$moduleId', params: { moduleId: '<id>' } }`. */
  nav: { to: string; params?: Record<string, string> }
  /** Hides the module and denies its routes for roles without this permission. */
  permission?: Permission
  Page: ComponentType<RemotePageProps>
}

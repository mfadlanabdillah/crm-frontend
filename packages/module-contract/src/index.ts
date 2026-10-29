/**
 * Contract between the host (`apps/crm-console`) and a micro frontend remote. Types only: import with
 * `import type`, so nothing from this package ends up in a bundle or needs to be a shared singleton.
 * Changing it is a breaking change for every remote.
 */
import type { ApiClient } from '@crm/api-client'
import type { Permission } from '@crm/auth'
import type { AnyRoute } from '@tanstack/react-router'
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

export type RemoteStreamStatus = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'closed'

/** What a remote exposes as `./module` (default export): one module, or a list of them. */
export interface RemoteModule {
  /** Unique across the host and every remote. */
  id: string
  /** i18n key of the module name. */
  labelKey: string
  icon: ComponentType<{ className?: string }>
  /**
   * Path prefix of the module. A module with its own `routes` owns the prefix (for example
   * `/cases`); one that only has a `Page` lives at `/remote/<id>`.
   */
  basePath: string
  /** Sidebar link target, for example `{ to: '/cases', search: { ... } }`. */
  nav: { to: string; params?: Record<string, string>; search?: Record<string, unknown> }
  /** Hides the module and denies its routes for roles without this permission. */
  permission?: Permission
  /** Single page rendered by the host under `/remote/<id>/`. Omit when the module has `routes`. */
  Page?: ComponentType<RemotePageProps>
  /**
   * Code-based routes of the module, added under the host's authenticated layout route before the
   * router is created. Share `@tanstack/react-router` as a singleton with the host.
   */
  routes?: (parent: AnyRoute) => AnyRoute[]
  /** Sidebar section shown while the module is active. */
  Sidebar?: ComponentType<{ variant?: 'sidebar' | 'inline' }>
  /** Tab row under the header, shown while the module is active. */
  Tabs?: ComponentType
  /** Realtime connection of the module; its status feeds the indicator in the header. */
  useRealtime?: () => RemoteStreamStatus
  /** Clears client state of the module when the session ends. */
  onSignOut?: (reason: 'logout' | 'expired') => void
}

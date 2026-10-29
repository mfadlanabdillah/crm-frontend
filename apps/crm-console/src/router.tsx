import { createRouter } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { RouteError, RouteNotFound } from './app/layout/RouteFallbacks'
import { queryClient } from './lib/query-client'
import { routeTree } from './routeTree.gen'
import { Route as authenticatedRoute } from './routes/_authenticated'

type RouteFactory = (parent: AnyRoute) => AnyRoute[]

/**
 * Remote modules bring their own routes (for example `/cases`). They hang under the authenticated
 * layout route, so they get the session context and the shell like any built-in route. Call this
 * once, after the remotes are loaded: the route tree is fixed when the router is created.
 */
export function createAppRouter(remoteRouteFactories: readonly RouteFactory[] = []) {
  // Same object the generated tree holds; its children are an array once the tree is built.
  const layout = authenticatedRoute as unknown as AnyRoute
  const extra = remoteRouteFactories.flatMap((create) => create(layout))
  layout.children = [...((layout.children ?? []) as unknown as AnyRoute[]), ...extra] as never

  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}

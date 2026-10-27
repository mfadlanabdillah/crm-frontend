import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { AuthProvider } from '@crm/auth'
import { RouteError, RouteNotFound } from '@/app/layout/RouteFallbacks'
import { useSession, sessionQueryOptions } from '@/app/auth/session'
import type { RouterContext } from '@/lib/router-context'

export const Route = createRootRouteWithContext<RouterContext>()({
  // Prefetch sesi sekali di root; guard per-route tinggal membaca cache.
  beforeLoad: async ({ context }) => ({
    session: await context.queryClient.ensureQueryData(sessionQueryOptions),
  }),
  component: RootComponent,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
})

function RootComponent() {
  const { data: session } = useSession()

  return (
    <AuthProvider session={session ?? null}>
      <Outlet />
    </AuthProvider>
  )
}

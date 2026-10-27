import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

/**
 * Render komponen yang memakai TanStack Query tanpa menyentuh jaringan.
 * Seed cache lewat `queryClient.setQueryData` sebelum render.
 */
export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) }
}

export interface RenderWithRouterOptions {
  queryClient?: QueryClient
  /** Where the memory history starts. */
  initialPath?: string
  /** Extra route paths (e.g. `/cases/$caseId`) so a `<Link to>` in `ui` resolves. */
  linkTargets?: string[]
  /** Passed to `createRootRoute`, e.g. `errorComponent` or `notFoundComponent`. */
  rootOptions?: Parameters<typeof createRootRoute>[0]
}

/**
 * Render a component that needs the router (`Link`, `useNavigate`, route errors) inside a memory
 * router, with the query client provider. `ui` is mounted at `/`; resolves once the router loaded.
 */
export async function renderWithRouter(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialPath = '/',
    linkTargets = [],
    rootOptions,
  }: RenderWithRouterOptions = {},
) {
  const root = createRootRoute(rootOptions)
  const index = createRoute({ getParentRoute: () => root, path: '/', component: () => ui })
  const targets = linkTargets.map((path) => createRoute({ getParentRoute: () => root, path }))
  const router = createRouter({
    routeTree: root.addChildren([index, ...targets]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  await router.load()

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router, queryClient, ...result }
}

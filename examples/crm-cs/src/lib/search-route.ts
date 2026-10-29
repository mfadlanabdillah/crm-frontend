import { getRouteApi } from '@tanstack/react-router'

interface SearchRouteApi<S> {
  useSearch: () => S
  useNavigate: () => (options: {
    search: Partial<S> | ((prev: S) => S)
    replace?: boolean
  }) => Promise<void>
}

/**
 * Route API for a route this remote adds to the host router. The host's route types are not
 * visible here, so the search shape is stated by the caller; `validateSearch` on the route
 * (see `routes.ts`) is what guarantees it at runtime.
 */
export function searchRoute<S>(id: string): SearchRouteApi<S> {
  return getRouteApi(id) as unknown as SearchRouteApi<S>
}

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '@crm/api-client'

let onUnauthorized: (() => void) | undefined

/** Dipasang shell (`app/auth/session-expiry`): lib tidak boleh tahu soal router atau modul. */
export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  onUnauthorized = handler
}

function handleError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) onUnauthorized?.()
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 4xx adalah keputusan server (401/403/404/422), bukan gangguan jaringan.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
    },
    mutations: { retry: false },
  },
})

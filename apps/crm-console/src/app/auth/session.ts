import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { sessionKey } from '@/lib/query-keys'
import { signIn } from './sign-in'

export const sessionQueryOptions = queryOptions({
  queryKey: sessionKey,
  queryFn: () => api.getSession(),
  staleTime: 60_000,
  retry: false,
})

export function useSession() {
  return useQuery(sessionQueryOptions)
}

export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => signIn(),
    onSuccess: (session) => {
      if (session) queryClient.setQueryData(sessionKey, session)
    },
  })
}

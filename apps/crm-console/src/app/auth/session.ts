import { api, sessionKey } from '@crm/app-kit'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { signIn } from './sign-in'
import { broadcastSession } from './sign-out'

export const sessionQueryOptions = queryOptions({
  queryKey: sessionKey,
  queryFn: async () => {
    const session = await api.getSession()
    if (session) broadcastSession(session.user.id)
    return session
  },
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

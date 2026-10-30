import { api, sessionKey } from '@crm/app-kit'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { allModules } from '@/app/modules/registry'
import type { SignOutReason } from '@/modules/types'

/**
 * Data milik sesi sebelumnya (PII, case, customer, ...) tidak boleh tertinggal di memori:
 * buang seluruh cache query, bukan daftar per modul yang bisa terlewat, lalu minta tiap modul
 * membersihkan state kliennya (store).
 */
export function resetClientState(queryClient: QueryClient, reason: SignOutReason = 'logout') {
  queryClient.removeQueries()
  queryClient.setQueryData(sessionKey, null)
  for (const module of allModules()) module.onSignOut?.(reason)
}

const CHANNEL_NAME = 'crm-auth'
const SIGNED_OUT = 'signed-out'
const SESSION = 'session'

/** Beri tahu tab lain di browser yang sama; no-op bila BroadcastChannel tidak ada. */
function post(message: unknown) {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.postMessage(message)
  channel.close()
}

const broadcastSignOut = () => post(SIGNED_OUT)

/** Announce which user this tab just read, so a tab that still shows another user can leave. */
export const broadcastSession = (userId: string) => post({ type: SESSION, userId })

function sessionUserId(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const { type, userId } = data as { type?: unknown; userId?: unknown }
  return type === SESSION && typeof userId === 'string' ? userId : undefined
}

export function listenRemoteSignOut(
  onSignedOut: () => void,
  onSessionUser?: (userId: string) => void,
) {
  if (typeof BroadcastChannel === 'undefined') return () => {}
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (event) => {
    if (event.data === SIGNED_OUT) return onSignedOut()
    const userId = sessionUserId(event.data)
    if (userId) onSessionUser?.(userId)
  }
  return () => channel.close()
}

export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => api.logout(),
    onSettled: () => {
      broadcastSignOut()
      resetClientState(queryClient)
      void navigate({ to: '/login' })
    },
  })
}

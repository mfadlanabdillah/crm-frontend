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

/** Beri tahu tab lain di browser yang sama; no-op bila BroadcastChannel tidak ada. */
function broadcastSignOut() {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.postMessage(SIGNED_OUT)
  channel.close()
}

export function listenRemoteSignOut(onSignedOut: () => void) {
  if (typeof BroadcastChannel === 'undefined') return () => {}
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (event) => {
    if (event.data === SIGNED_OUT) onSignedOut()
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

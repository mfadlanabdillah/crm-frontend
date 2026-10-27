import type { QueryClient } from '@tanstack/react-query'
import type { AnyRouter } from '@tanstack/react-router'
import { setUnauthorizedHandler } from '@/lib/query-client'
import type { SignOutReason } from '@/modules/types'
import { listenRemoteSignOut, resetClientState } from './sign-out'

/**
 * Sesi berakhir di server (401 dari query/mutation mana pun) atau agen keluar di tab lain:
 * buang data klien, lalu kembali ke /login dengan `redirect` ke halaman terakhir.
 */
export function installSessionExpiry(queryClient: QueryClient, router: AnyRouter) {
  let handling = false

  const leave = (reason: SignOutReason) => {
    if (handling) return
    const { pathname, href } = router.state.location
    if (pathname === '/login') return

    handling = true
    resetClientState(queryClient, reason)
    void router.navigate({ to: '/login', search: { redirect: href } }).finally(() => {
      handling = false
    })
  }

  setUnauthorizedHandler(() => leave('expired'))
  const stopListening = listenRemoteSignOut(() => leave('logout'))

  return () => {
    setUnauthorizedHandler(undefined)
    stopListening()
  }
}

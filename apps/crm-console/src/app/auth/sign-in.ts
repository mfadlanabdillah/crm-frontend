import { env } from '@crm/app-kit'
import type { Role, Session } from '@crm/api-client'

/**
 * Di produksi, login adalah redirect ke SSO internal lewat BFF; aplikasi tidak
 * pernah memegang token. Di dev/test, MSW membuat sesi lokal supaya alur UI
 * bisa dikerjakan tanpa backend.
 */
export async function signIn(role: Role = env.mockRole): Promise<Session | null> {
  if (!env.mocksEnabled) {
    const returnTo = window.location.pathname + window.location.search
    window.location.assign(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
    return null
  }

  const response = await fetch('/v1/dev/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ role }),
  })

  if (!response.ok) {
    throw new Error('Gagal membuat sesi mock')
  }

  return (await response.json()) as Session
}

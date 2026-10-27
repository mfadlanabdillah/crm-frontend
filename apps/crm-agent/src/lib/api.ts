import { createApiClient } from '@crm/api-client'
import { env } from './env'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export const api = createApiClient({
  baseUrl: env.apiBaseUrl,
  // Double-submit cookie: cookie `crm_csrf` tidak HttpOnly, session tetap HttpOnly.
  getCsrfToken: () => readCookie('crm_csrf'),
  onError: (error) => {
    if (error.status >= 500) {
      console.error('[api]', error.status, error.code, error.message, error.requestId)
    }
  },
})

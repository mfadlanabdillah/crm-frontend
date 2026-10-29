import type { Session } from '@crm/api-client'
import type { HttpHandler } from 'msw'

/** Default for `@crm/mock-domain`: the console ships no domain, so there is nothing to mock. */
export function createDomainHandlers(_options: {
  getSession: () => Session | null
}): HttpHandler[] {
  return []
}

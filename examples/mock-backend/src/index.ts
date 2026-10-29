/**
 * Dev mock backend for the example domain: cases, customers, and refunds, served by MSW. The console
 * loads it through the `@crm/mock-domain` alias (MOCK_DOMAIN); it is never part of a production build.
 */
export { createDomainHandlers } from './handlers'
export type { DomainMockOptions } from './handlers'
export { db } from './db'

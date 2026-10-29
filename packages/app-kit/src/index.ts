/**
 * Helpers shared by the console shell and the domain remotes. A remote must not import the shell's
 * `@/lib`, so everything both sides need lives here (shared as a singleton at runtime).
 */
export { api } from './api'
export { env } from './env'
export { formatDateTime, formatNumber, formatRelative, initials } from './format'
export { masterDataKey, sessionKey } from './query-keys'
export { backoffDelay, createEventStream } from './sse'
export type { EventStreamOptions, StreamStatus } from './sse'
export { stripHtml } from './text'
export { requirePermission } from './guard'

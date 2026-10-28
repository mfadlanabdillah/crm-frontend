import type { Role } from '@crm/api-client'

function parseMockRole(value: string | undefined): Role {
  return value === 'l1' || value === 'l2' || value === 'supervisor' || value === 'admin'
    ? value
    : 'supervisor'
}

const enableMocks = import.meta.env.VITE_ENABLE_MOCKS

export const env = {
  /** Same-origin oleh default: browser hanya bicara ke BFF, bukan ke backend Go langsung. */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/',
  /** Mock hanya di dev server; build produksi tidak memuat MSW sama sekali. */
  mocksEnabled: import.meta.env.DEV && enableMocks !== 'false',
  mockRole: parseMockRole(import.meta.env.VITE_MOCK_ROLE),
  mockEvents: import.meta.env.VITE_MOCK_EVENTS === 'true',
  telemetryUrl: import.meta.env.VITE_TELEMETRY_URL,
} as const

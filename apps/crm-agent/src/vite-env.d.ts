/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ENABLE_MOCKS?: string
  readonly VITE_MOCK_ROLE?: string
  readonly VITE_MOCK_EVENTS?: string
  readonly VITE_TELEMETRY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

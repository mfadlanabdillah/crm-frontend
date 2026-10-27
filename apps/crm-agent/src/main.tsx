import './styles.css'
import { createI18n } from '@crm/i18n'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installSessionExpiry } from './app/auth/session-expiry'
import { env } from './lib/env'
import { queryClient } from './lib/query-client'
import { initWebVitals, installGlobalErrorHandlers } from './lib/telemetry'
import { router } from './router'

async function bootstrap() {
  await createI18n()

  // Guard DEV statis supaya Rollup membuang import ini dari bundle produksi.
  if (import.meta.env.DEV && env.mocksEnabled) {
    const { startMockWorker } = await import('./mocks/browser')
    await startMockWorker()
  }

  installGlobalErrorHandlers()
  initWebVitals()
  installSessionExpiry(queryClient, router)

  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('Elemen #root tidak ditemukan di index.html')

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()

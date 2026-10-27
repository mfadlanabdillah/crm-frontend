import { setupWorker } from 'msw/browser'
import { env } from '@/lib/env'
import { db } from './db'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMockWorker(): Promise<void> {
  // Sesi default supaya dev/e2e langsung masuk; tombol keluar mengosongkannya.
  db.setSession(env.mockRole)

  await worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}

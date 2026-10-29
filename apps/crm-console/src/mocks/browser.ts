import { env } from '@crm/app-kit'
import { setupWorker } from 'msw/browser'
import { ROLES } from '@crm/auth'
import type { Role } from '@crm/auth'
import { db } from './db'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

/** Dev only: `?role=l1` opens the app as that role without restarting the dev server. */
function roleFromUrl(): Role | undefined {
  const value = new URLSearchParams(window.location.search).get('role')
  return ROLES.find((role) => role === value)
}

export async function startMockWorker(): Promise<void> {
  // Sesi default supaya dev/e2e langsung masuk; tombol keluar mengosongkannya.
  db.setSession(roleFromUrl() ?? env.mockRole)

  await worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}

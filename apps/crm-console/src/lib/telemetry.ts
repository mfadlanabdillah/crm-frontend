import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'
import type { Metric } from 'web-vitals'
import { env } from '@crm/app-kit'

/**
 * Budget bundle diperiksa `pnpm size`. Fungsi ini hanya mengirim Web Vitals ke endpoint observability internal.
 */
export function initWebVitals(): void {
  const report = (metric: Metric) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`[web-vitals] ${metric.name}`, metric.value, metric.rating)
    }
    if (!env.telemetryUrl) return
    void fetch(env.telemetryUrl, {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
      }),
    }).catch(() => {
      // Telemetri tidak boleh mengganggu alur agen.
    })
  }

  onCLS(report)
  onINP(report)
  onLCP(report)
  onFCP(report)
  onTTFB(report)
}

type ErrorReporter = (error: unknown, context?: Record<string, unknown>) => void

let errorReporter: ErrorReporter | undefined

/** Titik pasang SDK pelaporan error (mis. Sentry) tanpa mengubah pemanggil. */
export function setErrorReporter(reporter: ErrorReporter | undefined): void {
  errorReporter = reporter
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error('[app-error]', error, context)
  try {
    errorReporter?.(error, context)
  } catch {
    // Pelaporan tidak boleh melempar error baru.
  }
}

/** Menangkap error di luar React: skrip yang melempar dan promise yang ditolak tanpa catch. */
export function installGlobalErrorHandlers(): () => void {
  const onError = (event: ErrorEvent) =>
    reportError(event.error ?? event.message, { source: 'window.error' })
  const onRejection = (event: PromiseRejectionEvent) =>
    reportError(event.reason, { source: 'unhandledrejection' })

  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  return () => {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
  }
}

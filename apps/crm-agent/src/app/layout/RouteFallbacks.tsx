import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@crm/api-client'
import { Button } from '@crm/ui'
import { reportError } from '@/lib/telemetry'

/** Dipakai root dan `defaultErrorComponent`: error halaman muncul di dalam shell, bukan menggantinya. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const requestId = error instanceof ApiError ? error.requestId : undefined

  useEffect(() => {
    reportError(error, { source: 'route' })
  }, [error])

  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <AlertTriangle className="size-8 text-danger" aria-hidden="true" />
      <p className="text-lg font-semibold text-ink">{t('errors.title')}</p>
      <p className="max-w-md text-sm text-ink-muted">{t('errors.description')}</p>
      {requestId ? (
        <p className="font-mono text-xs text-ink-muted">
          {t('errors.reference', { id: requestId })}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            void router.invalidate()
            reset()
          }}
        >
          {t('common.retry')}
        </Button>
        <Button variant="ghost" onClick={() => window.location.reload()}>
          {t('errors.reload')}
        </Button>
      </div>
    </div>
  )
}

export function RouteNotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-ink-muted">
      {t('errors.notFound')}
    </div>
  )
}

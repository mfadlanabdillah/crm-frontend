import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <Inbox className="mb-1 size-8 text-ink-muted" aria-hidden="true" />
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      {action}
    </div>
  )
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry: () => void
}) {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center"
    >
      <AlertTriangle className="mb-1 size-8 text-danger" aria-hidden="true" />
      <p className="text-sm font-semibold text-ink">{title ?? t('common.errorTitle')}</p>
      <p className="max-w-sm text-sm text-ink-muted">
        {description ?? t('common.errorDescription')}
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
        <RefreshCw className="size-4" aria-hidden="true" />
        {t('common.retry')}
      </Button>
    </div>
  )
}

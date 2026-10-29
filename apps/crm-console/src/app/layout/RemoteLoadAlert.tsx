import { useTranslation } from 'react-i18next'
import { Alert, Button } from '@crm/ui'
import { failedRemotes } from '@/app/modules/remote'

/** Shown when a remote did not load: its menus and routes are missing until the page is reloaded. */
export function RemoteLoadAlert({ names = failedRemotes }: { names?: readonly string[] }) {
  const { t } = useTranslation()
  if (names.length === 0) return null

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-surface-raised px-4 py-2">
      <Alert>{t('remote.loadFailed', { names: names.join(', ') })}</Alert>
      <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
        {t('remote.retry')}
      </Button>
    </div>
  )
}

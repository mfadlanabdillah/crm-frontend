import { useTranslation } from 'react-i18next'
import { allModules } from '@/app/modules/registry'
import { EmptyState } from '@/components/ui/data-state'

/** Renders the page of a module that was loaded from a remote app, or says it is unavailable. */
export function RemoteModulePage({ moduleId }: { moduleId: string }) {
  const { t } = useTranslation()
  const Page = allModules().find((module) => module.id === moduleId)?.Page

  if (!Page) {
    return (
      <EmptyState
        title={t('remote.unavailableTitle')}
        description={t('remote.unavailableDescription')}
      />
    )
  }
  return <Page />
}

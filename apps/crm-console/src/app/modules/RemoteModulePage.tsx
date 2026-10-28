import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { allModules } from '@/app/modules/registry'
import { EmptyState } from '@/components/ui/data-state'
import { api } from '@/lib/api'
import { safeRedirectPath } from '@/lib/redirect'

/**
 * Renders the page of a module that was loaded from a remote app, or says it is unavailable.
 * The remote gets the host's API client and a `navigate` that stays inside the host router.
 */
export function RemoteModulePage({ moduleId, subPath }: { moduleId: string; subPath: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const Page = allModules().find((module) => module.id === moduleId)?.Page

  if (!Page) {
    return (
      <EmptyState
        title={t('remote.unavailableTitle')}
        description={t('remote.unavailableDescription')}
      />
    )
  }
  const goTo = (next: string) => {
    const base = `/remote/${moduleId}`
    router.history.push(next ? `${base}/${next}` : base)
  }
  const openHostPath = (path: string) => {
    const safe = safeRedirectPath(path)
    if (safe) router.history.push(safe)
  }
  return <Page api={api} subPath={subPath} navigate={goTo} openHostPath={openHostPath} />
}

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@crm/ui'
import { getVisibleModules } from '@/app/modules/registry'

function NoModules() {
  const { t } = useTranslation()
  return (
    <EmptyState title={t('home.noModulesTitle')} description={t('home.noModulesDescription')} />
  )
}

export const Route = createFileRoute('/_authenticated/')({
  // The start page is the first module this role can see; with none, the shell says so.
  beforeLoad: ({ context }) => {
    const first = getVisibleModules(context.session.user.role)[0]
    if (first) throw redirect({ ...first.nav, replace: true } as never)
  },
  component: NoModules,
})

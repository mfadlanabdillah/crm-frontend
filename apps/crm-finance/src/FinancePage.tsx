import { useAuth } from '@crm/auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { version as reactVersion, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './finance.css'

/**
 * Proves the remote shares the host's context: the session (AuthProvider), the QueryClient cache,
 * i18n, and the single React instance. It reads no API and invents no domain data.
 */
export function FinancePage() {
  const { t, i18n } = useTranslation()
  const { session, role } = useAuth()
  const queryClient = useQueryClient()
  const [clicks, setClicks] = useState(0)

  // Written into the host's QueryClient: shows up in the host cache too.
  const { data: loadedAt } = useQuery({
    queryKey: ['finance', 'poc-loaded-at'],
    queryFn: () => new Date().toISOString(),
    staleTime: Infinity,
  })

  return (
    <div className="finance-poc">
      <h2>{t('finance.title')}</h2>
      <p>{t('finance.intro')}</p>
      <div className="finance-poc__card">
        <dl>
          <dt>{t('finance.user')}</dt>
          <dd>{session?.user.name ?? '-'}</dd>
          <dt>{t('finance.role')}</dt>
          <dd>{role ?? '-'}</dd>
          <dt>{t('finance.language')}</dt>
          <dd>{i18n.language}</dd>
          <dt>{t('finance.reactVersion')}</dt>
          <dd>{reactVersion}</dd>
          <dt>{t('finance.cachedQueries')}</dt>
          <dd>{queryClient.getQueryCache().getAll().length}</dd>
          <dt>{t('finance.loadedAt')}</dt>
          <dd>{loadedAt ?? '-'}</dd>
        </dl>
        <button type="button" onClick={() => setClicks((n) => n + 1)}>
          {t('finance.clicks', { count: clicks })}
        </button>
      </div>
    </div>
  )
}

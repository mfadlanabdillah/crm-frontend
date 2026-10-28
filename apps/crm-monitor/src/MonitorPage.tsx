import type { RemotePageProps } from '@crm/module-contract'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import './monitor.css'

const REFRESH_MS = 30_000

/** Read-only view of the queue load: it uses the host's API client and writes nothing. */
export function MonitorPage({ api }: RemotePageProps) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language)
  const summary = useQuery({
    queryKey: ['monitor', 'summary'],
    queryFn: ({ signal }) => api.getCaseSummary(signal),
    refetchInterval: REFRESH_MS,
  })
  const master = useQuery({
    queryKey: ['monitor', 'master-data'],
    queryFn: ({ signal }) => api.getMasterData(signal),
    staleTime: 5 * 60_000,
  })

  let body
  if (summary.isPending || master.isPending) body = <p>{t('monitor.loading')}</p>
  else if (summary.isError || master.isError) body = <p role="alert">{t('monitor.failed')}</p>
  else {
    const { queues, unassigned, overdue } = summary.data
    body = (
      <>
        <div className="monitor__stats">
          <div className="monitor__stat">
            <span>{t('monitor.unassigned')}</span>
            <strong>{number.format(unassigned)}</strong>
          </div>
          <div className="monitor__stat">
            <span>{t('monitor.overdue')}</span>
            <strong>{number.format(overdue)}</strong>
          </div>
        </div>
        <table className="monitor__table">
          <thead>
            <tr>
              <th scope="col">{t('monitor.queue')}</th>
              <th scope="col">{t('monitor.open')}</th>
            </tr>
          </thead>
          <tbody>
            {master.data.queues.map((queue) => (
              <tr key={queue.code}>
                <td>{queue.label}</td>
                <td>{number.format(queues[queue.code] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="monitor__note">{t('monitor.refreshed')}</p>
      </>
    )
  }

  return (
    <div className="monitor">
      <h2>{t('monitor.title')}</h2>
      <p>{t('monitor.intro')}</p>
      {body}
    </div>
  )
}

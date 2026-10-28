import type { RemotePageProps } from '@crm/module-contract'
import { useQuery } from '@tanstack/react-query'
import type { MouseEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import './monitor.css'

const REFRESH_MS = 30_000

/** A real href keeps "open in new tab" working; a plain click opens the host path in the host router. */
function HostLink({
  to,
  open,
  children,
}: {
  to: string
  open: (path: string) => void
  children: ReactNode
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    open(to)
  }
  return (
    <a className="monitor__link" href={to} onClick={onClick}>
      {children}
    </a>
  )
}

/** Read-only view of the queue load: it uses the host's API client and writes nothing. */
export function MonitorPage({ api, openHostPath }: RemotePageProps) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language)
  const summary = useQuery({
    queryKey: ['monitor', 'summary'],
    queryFn: ({ signal }) => api.getCaseSummary(signal),
    refetchInterval: REFRESH_MS,
    // Always fresh when the page is opened: a queue move in another menu must show up here.
    staleTime: 0,
    refetchOnMount: 'always',
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
            <strong>
              <HostLink to="/cases?view=unassigned" open={openHostPath}>
                {number.format(unassigned)}
              </HostLink>
            </strong>
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
                <td>
                  <HostLink to={`/cases?queue=${queue.code}`} open={openHostPath}>
                    {queue.label}
                  </HostLink>
                </td>
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

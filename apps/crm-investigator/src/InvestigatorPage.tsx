import type {
  ApiClient,
  Case,
  MasterData,
  MasterDataItem,
  UpdateCaseRequest,
} from '@crm/api-client'
import type { RemotePageProps } from '@crm/module-contract'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import './investigator.css'

/**
 * Assumption on the provisional contract: master data has an escalation queue with this code (the
 * mock does). Never fall back to another queue: that would show another team's cases.
 */
const ESCALATION_QUEUE = 'escalated'
const PAGE_SIZE = 10
const BASE = '/remote/investigator'

const label = (items: MasterDataItem[] | undefined, code: string) =>
  items?.find((item) => item.code === code)?.label ?? code

// A real href keeps "open in new tab" working; a plain click moves inside the host router.
function RemoteLink({
  to,
  navigate,
  children,
}: {
  to: string
  navigate: (subPath: string) => void
  children: ReactNode
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    navigate(to)
  }
  return (
    <a className="investigator__link" href={to ? `${BASE}/${to}` : BASE} onClick={onClick}>
      {children}
    </a>
  )
}

function useMasterData(api: ApiClient) {
  return useQuery({
    queryKey: ['investigator', 'master-data'],
    queryFn: ({ signal }) => api.getMasterData(signal),
    staleTime: 5 * 60_000,
  })
}

function CaseList({ api, navigate }: Pick<RemotePageProps, 'api' | 'navigate'>) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const master = useMasterData(api)
  const hasQueue = master.data?.queues.some((queue) => queue.code === ESCALATION_QUEUE) ?? false

  const cases = useQuery({
    queryKey: ['investigator', 'cases', page],
    queryFn: ({ signal }) =>
      api.listCases({ queue: ESCALATION_QUEUE, page, page_size: PAGE_SIZE }, signal),
    enabled: hasQueue,
    staleTime: 0,
  })

  if (master.isPending) return <p>{t('investigator.loading')}</p>
  if (master.isError) return <p role="alert">{t('investigator.failed')}</p>
  if (!hasQueue) return <p>{t('investigator.noQueue')}</p>
  if (cases.isPending) return <p>{t('investigator.loading')}</p>
  if (cases.isError) return <p role="alert">{t('investigator.failed')}</p>
  if (cases.data.items.length === 0) return <p>{t('investigator.empty')}</p>

  const { items, meta } = cases.data
  return (
    <>
      <table className="investigator__table">
        <thead>
          <tr>
            {['code', 'subject', 'customer', 'status', 'priority', 'updated'].map((key) => (
              <th key={key} scope="col">
                {t(`investigator.${key}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.code}</td>
              <td>
                <RemoteLink to={`case/${item.id}`} navigate={navigate}>
                  {item.subject}
                </RemoteLink>
              </td>
              <td>{item.customer.name}</td>
              <td>{label(master.data?.statuses, item.status)}</td>
              <td>{label(master.data?.priorities, item.priority)}</td>
              <td>{new Date(item.updatedAt).toLocaleString(i18n.language)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="investigator__pager">
        <button type="button" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>
          {t('investigator.previous')}
        </button>
        <span>{t('investigator.pageOf', { page: meta.page, total: meta.totalPages })}</span>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => setPage(meta.page + 1)}
        >
          {t('investigator.next')}
        </button>
      </div>
    </>
  )
}

function CaseActions({
  api,
  item,
  master,
  openHostPath,
}: Pick<RemotePageProps, 'api' | 'openHostPath'> & { item: Case; master: MasterData | undefined }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')

  // Host views are cached under keys starting with 'cases'. The remote refreshes them itself after
  // a write: this couples it to the host's key names (see docs/poc/micro-frontend.md).
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['investigator'] }),
      queryClient.invalidateQueries({ queryKey: ['cases'] }),
    ])
  const update = useMutation({
    mutationFn: (patch: UpdateCaseRequest) => api.updateCase(item.id, patch),
    onSuccess: refresh,
  })
  const addNote = useMutation({
    mutationFn: () => api.createReply(item.id, { body: note.trim(), visibility: 'internal' }),
    onSuccess: async () => {
      setNote('')
      await refresh()
    },
  })

  const openCase = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    openHostPath(`/cases/${item.id}`)
  }

  return (
    <section className="investigator__actions" aria-label={t('investigator.actions')}>
      <label>
        {t('investigator.status')}
        <select
          value={item.status}
          disabled={update.isPending}
          onChange={(event) => update.mutate({ status: event.target.value })}
        >
          {master?.statuses.map((status) => (
            <option key={status.code} value={status.code}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('investigator.queue')}
        <select
          value={item.queue}
          disabled={update.isPending}
          onChange={(event) => update.mutate({ queue: event.target.value })}
        >
          {master?.queues.map((queue) => (
            <option key={queue.code} value={queue.code}>
              {queue.label}
            </option>
          ))}
        </select>
      </label>
      <a className="investigator__link" href={`/cases/${item.id}`} onClick={openCase}>
        {t('investigator.openInCase')}
      </a>
      {update.isError ? <p role="alert">{update.error.message}</p> : null}

      <label htmlFor="investigator-note">{t('investigator.note')}</label>
      <textarea
        id="investigator-note"
        rows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <button
        type="button"
        disabled={note.trim().length === 0 || addNote.isPending}
        onClick={() => addNote.mutate()}
      >
        {t('investigator.addNote')}
      </button>
      {addNote.isError ? <p role="alert">{addNote.error.message}</p> : null}
    </section>
  )
}

function CaseDetail({
  api,
  navigate,
  openHostPath,
  caseId,
}: Pick<RemotePageProps, 'api' | 'navigate' | 'openHostPath'> & { caseId: string }) {
  const { t, i18n } = useTranslation()
  const master = useMasterData(api)
  const detail = useQuery({
    queryKey: ['investigator', 'case', caseId],
    queryFn: ({ signal }) => api.getCase(caseId, signal),
    staleTime: 0,
  })

  const back = (
    <RemoteLink to="" navigate={navigate}>
      ← {t('investigator.back')}
    </RemoteLink>
  )
  if (detail.isPending) return <p>{t('investigator.loading')}</p>
  if (detail.isError) {
    return (
      <>
        <p role="alert">{t('investigator.failed')}</p>
        {back}
      </>
    )
  }

  // Contact details are left out on purpose: the server masks PII per role, and this team's view
  // does not need them.
  const item = detail.data
  return (
    <>
      {back}
      <h3>
        {item.code} · {item.subject}
      </h3>
      <dl className="investigator__facts">
        <dt>{t('investigator.customer')}</dt>
        <dd>{item.customer.name}</dd>
        <dt>{t('investigator.status')}</dt>
        <dd>{label(master.data?.statuses, item.status)}</dd>
        <dt>{t('investigator.priority')}</dt>
        <dd>{label(master.data?.priorities, item.priority)}</dd>
        <dt>{t('investigator.assignee')}</dt>
        <dd>{item.assignee?.name ?? t('investigator.unassigned')}</dd>
        <dt>{t('investigator.stt')}</dt>
        <dd>{item.sttNumber ?? '—'}</dd>
      </dl>
      <CaseActions api={api} item={item} master={master.data} openHostPath={openHostPath} />
      <h4>{t('investigator.timeline')}</h4>
      <ul className="investigator__timeline">
        {item.timeline.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.author.name}</strong>
            {entry.visibility === 'internal' ? (
              <span className="investigator__badge">{t('investigator.internal')}</span>
            ) : null}{' '}
            <time dateTime={entry.createdAt}>
              {new Date(entry.createdAt).toLocaleString(i18n.language)}
            </time>
            {entry.body ? <p>{entry.body}</p> : null}
          </li>
        ))}
      </ul>
    </>
  )
}

export function InvestigatorPage({ api, subPath, navigate, openHostPath }: RemotePageProps) {
  const { t } = useTranslation()
  const [section, id] = subPath.split('/')

  let body: ReactNode
  if (subPath === '') body = <CaseList api={api} navigate={navigate} />
  else if (section === 'case' && id) {
    body = <CaseDetail api={api} navigate={navigate} openHostPath={openHostPath} caseId={id} />
  } else body = <p>{t('investigator.notFound')}</p>

  return (
    <div className="investigator">
      <h2>{t('investigator.title')}</h2>
      <p>{t('investigator.intro')}</p>
      {body}
    </div>
  )
}

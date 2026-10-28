import { useAuth } from '@crm/auth'
import type { MasterDataItem, Refund } from '@crm/api-client'
import type { RemotePageProps } from '@crm/module-contract'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import './finance.css'

const PAGE_SIZE = 10

const label = (items: MasterDataItem[] | undefined, code: string) =>
  items?.find((item) => item.code === code)?.label ?? code

function DecisionPanel({
  refund,
  api,
  openHostPath,
  onDone,
}: Pick<RemotePageProps, 'api' | 'openHostPath'> & { refund: Refund; onDone: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')

  const decide = useMutation({
    mutationFn: (decision: 'approved' | 'rejected') =>
      api.decideRefund(refund.id, { decision, note: note.trim() }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['finance'] }),
    onSuccess: onDone,
  })

  const openCase = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    openHostPath(`/cases/${refund.caseId}`)
  }
  const ready = note.trim().length >= 3 && !decide.isPending

  return (
    <div className="finance__panel">
      <p>
        {refund.reason} ·{' '}
        <a href={`/cases/${refund.caseId}`} onClick={openCase}>
          {t('finance.openCase')} {refund.caseCode}
        </a>
      </p>
      <label htmlFor={`note-${refund.id}`}>{t('finance.note')}</label>
      <textarea
        id={`note-${refund.id}`}
        value={note}
        rows={2}
        aria-describedby={`hint-${refund.id}`}
        onChange={(event) => setNote(event.target.value)}
      />
      <p id={`hint-${refund.id}`} className="finance__hint">
        {t('finance.noteHint')}
      </p>
      <div className="finance__actions">
        <button type="button" disabled={!ready} onClick={() => decide.mutate('approved')}>
          {t('finance.approve')}
        </button>
        <button
          type="button"
          className="finance__secondary"
          disabled={!ready}
          onClick={() => decide.mutate('rejected')}
        >
          {t('finance.reject')}
        </button>
      </div>
      {decide.isError ? <p role="alert">{decide.error.message}</p> : null}
    </div>
  )
}

export function FinancePage({ api, openHostPath }: RemotePageProps) {
  const { t, i18n } = useTranslation()
  const { session, role } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)

  const master = useQuery({
    queryKey: ['finance', 'master-data'],
    queryFn: ({ signal }) => api.getMasterData(signal),
    staleTime: 5 * 60_000,
  })
  const refunds = useQuery({
    queryKey: ['finance', 'refunds', status, page],
    queryFn: ({ signal }) =>
      api.listRefunds({ page, page_size: PAGE_SIZE, ...(status ? { status } : {}) }, signal),
    staleTime: 0,
  })
  const money = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
  const statuses = master.data?.refundStatuses

  let body
  if (refunds.isPending || master.isPending) body = <p>{t('finance.loading')}</p>
  else if (refunds.isError || master.isError) body = <p role="alert">{t('finance.failed')}</p>
  else if (refunds.data.items.length === 0) body = <p>{t('finance.empty')}</p>
  else {
    const { items, meta } = refunds.data
    body = (
      <>
        <table className="finance__table">
          <thead>
            <tr>
              {['code', 'customer', 'amount', 'requested', 'filter'].map((key) => (
                <th key={key} scope="col">
                  {t(`finance.${key}`)}
                </th>
              ))}
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {items.map((refund) => (
              <tr key={refund.id}>
                <td>{refund.code}</td>
                <td>{refund.customerName}</td>
                <td>{money.format(refund.amount)}</td>
                <td>{new Date(refund.requestedAt).toLocaleDateString(i18n.language)}</td>
                <td>
                  {label(statuses, refund.status)}
                  {refund.decidedBy ? (
                    <small className="finance__hint">
                      {' '}
                      {t('finance.decidedBy', { name: refund.decidedBy.name })}
                    </small>
                  ) : null}
                </td>
                <td>
                  {refund.status === 'pending' ? (
                    <button
                      type="button"
                      className="finance__secondary"
                      aria-expanded={openId === refund.id}
                      onClick={() => setOpenId(openId === refund.id ? null : refund.id)}
                    >
                      {openId === refund.id ? t('finance.close') : t('finance.decide')}
                    </button>
                  ) : null}
                  {openId === refund.id && refund.status === 'pending' ? (
                    <DecisionPanel
                      refund={refund}
                      api={api}
                      openHostPath={openHostPath}
                      onDone={() => setOpenId(null)}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="finance__pager">
          <button type="button" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>
            {t('finance.previous')}
          </button>
          <span>{t('finance.pageOf', { page: meta.page, total: meta.totalPages })}</span>
          <button
            type="button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setPage(meta.page + 1)}
          >
            {t('finance.next')}
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="finance">
      <h2>{t('finance.title')}</h2>
      <p>{t('finance.intro')}</p>
      <label className="finance__filter">
        {t('finance.filter')}
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setPage(1)
            setOpenId(null)
          }}
        >
          <option value="">{t('finance.all')}</option>
          {statuses?.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {body}
      <dl className="finance__shared" aria-label={t('finance.sharedTitle')}>
        <dt>{t('finance.user')}</dt>
        <dd>{session?.user.name ?? '-'}</dd>
        <dt>{t('finance.role')}</dt>
        <dd>{role ?? '-'}</dd>
        <dt>{t('finance.cachedQueries')}</dt>
        <dd>{queryClient.getQueryCache().getAll().length}</dd>
      </dl>
    </div>
  )
}

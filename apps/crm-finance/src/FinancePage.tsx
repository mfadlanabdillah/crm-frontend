import { useAuth } from '@crm/auth'
import type { MasterDataItem, Refund } from '@crm/api-client'
import type { RemotePageProps } from '@crm/module-contract'
import {
  Alert,
  Badge,
  Button,
  Card,
  DescriptionItem,
  DescriptionList,
  EmptyState,
  ErrorState,
  FormField,
  Inline,
  Page,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Table,
  TBody,
  Td,
  TextLink,
  Textarea,
  Th,
  THead,
  Tr,
} from '@crm/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10

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
  const ready = note.trim().length >= 3 && !decide.isPending

  return (
    <Card>
      <Stack gap="sm">
        <p>
          {refund.reason} ·{' '}
          <TextLink
            inline
            href={`/cases/${refund.caseId}`}
            onNavigate={() => openHostPath(`/cases/${refund.caseId}`)}
          >
            {t('finance.openCase')} {refund.caseCode}
          </TextLink>
        </p>
        <FormField label={t('finance.note')} hint={t('finance.noteHint')}>
          {(control) => (
            <Textarea
              {...control}
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          )}
        </FormField>
        <Inline gap="sm">
          <Button disabled={!ready} onClick={() => decide.mutate('approved')}>
            {t('finance.approve')}
          </Button>
          <Button variant="secondary" disabled={!ready} onClick={() => decide.mutate('rejected')}>
            {t('finance.reject')}
          </Button>
        </Inline>
        {decide.isError ? <Alert>{decide.error.message}</Alert> : null}
      </Stack>
    </Card>
  )
}

function statusBadge(items: MasterDataItem[] | undefined, code: string) {
  const item = items?.find((candidate) => candidate.code === code)
  return <Badge tone={item?.tone ?? 'neutral'}>{item?.label ?? code}</Badge>
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
  if (refunds.isPending || master.isPending) {
    body = (
      <Stack gap="sm" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Stack>
    )
  } else if (refunds.isError || master.isError) {
    body = <ErrorState onRetry={() => void refunds.refetch()} />
  } else if (refunds.data.items.length === 0) {
    body = <EmptyState title={t('finance.empty')} description={t('common.emptyDescription')} />
  } else {
    const { items, meta } = refunds.data
    body = (
      <Card padded={false}>
        <Table aria-label={t('finance.title')}>
          <THead>
            <Tr>
              {['code', 'customer', 'amount', 'requested', 'filter', 'decision'].map((key) => (
                <Th key={key}>{t(`finance.${key}`)}</Th>
              ))}
              <Th aria-label={t('finance.decide')} />
            </Tr>
          </THead>
          <TBody>
            {items.map((refund) => (
              <Tr key={refund.id}>
                <Td nowrap>{refund.code}</Td>
                <Td>{refund.customerName}</Td>
                <Td nowrap>{money.format(refund.amount)}</Td>
                <Td>{new Date(refund.requestedAt).toLocaleDateString(i18n.language)}</Td>
                <Td>{statusBadge(statuses, refund.status)}</Td>
                <Td>
                  {refund.decidedBy ? t('finance.decidedBy', { name: refund.decidedBy.name }) : '—'}
                </Td>
                <Td>
                  {refund.status === 'pending' ? (
                    <Stack gap="sm">
                      <Inline>
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-expanded={openId === refund.id}
                          onClick={() => setOpenId(openId === refund.id ? null : refund.id)}
                        >
                          {openId === refund.id ? t('finance.close') : t('finance.decide')}
                        </Button>
                      </Inline>
                      {openId === refund.id ? (
                        <DecisionPanel
                          refund={refund}
                          api={api}
                          openHostPath={openHostPath}
                          onDone={() => setOpenId(null)}
                        />
                      ) : null}
                    </Stack>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
      </Card>
    )
  }

  return (
    <Page width="lg">
      <Stack gap="lg">
        <PageHeader title={t('finance.title')} description={t('finance.intro')} />
        <Inline>
          <FormField label={t('finance.filter')}>
            {(control) => (
              <Select
                {...control}
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
              </Select>
            )}
          </FormField>
        </Inline>
        {body}
        <Card as="section" aria-label={t('finance.sharedTitle')}>
          <DescriptionList layout="grid">
            <DescriptionItem label={t('finance.user')}>{session?.user.name ?? '-'}</DescriptionItem>
            <DescriptionItem label={t('finance.role')}>{role ?? '-'}</DescriptionItem>
            <DescriptionItem label={t('finance.cachedQueries')}>
              {queryClient.getQueryCache().getAll().length}
            </DescriptionItem>
          </DescriptionList>
        </Card>
      </Stack>
    </Page>
  )
}

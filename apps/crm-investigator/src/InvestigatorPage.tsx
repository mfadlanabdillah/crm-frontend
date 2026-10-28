import type {
  ApiClient,
  Case,
  MasterData,
  MasterDataItem,
  UpdateCaseRequest,
} from '@crm/api-client'
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
  SectionHeading,
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
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Assumption on the provisional contract: master data has an escalation queue with this code (the
 * mock does). Never fall back to another queue: that would show another team's cases.
 */
const ESCALATION_QUEUE = 'escalated'
const PAGE_SIZE = 10
const BASE = '/remote/investigator'

function levelBadge(items: MasterDataItem[] | undefined, code: string) {
  const item = items?.find((candidate) => candidate.code === code)
  return <Badge tone={item?.tone ?? 'neutral'}>{item?.label ?? code}</Badge>
}

function useMasterData(api: ApiClient) {
  return useQuery({
    queryKey: ['investigator', 'master-data'],
    queryFn: ({ signal }) => api.getMasterData(signal),
    staleTime: 5 * 60_000,
  })
}

function LoadingRows() {
  return (
    <Stack gap="sm" aria-busy="true">
      <Skeleton size="row" />
      <Skeleton size="row" />
      <Skeleton size="row" />
    </Stack>
  )
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

  if (master.isPending) return <LoadingRows />
  if (master.isError) return <ErrorState onRetry={() => void master.refetch()} />
  if (!hasQueue) {
    return (
      <EmptyState title={t('investigator.noQueue')} description={t('common.emptyDescription')} />
    )
  }
  if (cases.isPending) return <LoadingRows />
  if (cases.isError) return <ErrorState onRetry={() => void cases.refetch()} />
  if (cases.data.items.length === 0) {
    return <EmptyState title={t('investigator.empty')} description={t('common.emptyDescription')} />
  }

  const { items, meta } = cases.data
  return (
    <Card padded={false}>
      <Table aria-label={t('investigator.title')}>
        <THead>
          <Tr>
            {['code', 'subject', 'customer', 'status', 'priority', 'updated'].map((key) => (
              <Th key={key}>{t(`investigator.${key}`)}</Th>
            ))}
          </Tr>
        </THead>
        <TBody>
          {items.map((item) => (
            <Tr key={item.id}>
              <Td>{item.code}</Td>
              <Td>
                <TextLink
                  href={`${BASE}/case/${item.id}`}
                  onNavigate={() => navigate(`case/${item.id}`)}
                >
                  {item.subject}
                </TextLink>
              </Td>
              <Td>{item.customer.name}</Td>
              <Td>{levelBadge(master.data?.statuses, item.status)}</Td>
              <Td>{levelBadge(master.data?.priorities, item.priority)}</Td>
              <Td>{new Date(item.updatedAt).toLocaleString(i18n.language)}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </Card>
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

  return (
    <Card as="section" aria-label={t('investigator.actions')}>
      <Stack gap="lg">
        <Inline gap="lg" align="end">
          <FormField label={t('investigator.status')}>
            {(control) => (
              <Select
                {...control}
                value={item.status}
                disabled={update.isPending}
                onChange={(event) => update.mutate({ status: event.target.value })}
              >
                {master?.statuses.map((status) => (
                  <option key={status.code} value={status.code}>
                    {status.label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label={t('investigator.queue')}>
            {(control) => (
              <Select
                {...control}
                value={item.queue}
                disabled={update.isPending}
                onChange={(event) => update.mutate({ queue: event.target.value })}
              >
                {master?.queues.map((queue) => (
                  <option key={queue.code} value={queue.code}>
                    {queue.label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <TextLink href={`/cases/${item.id}`} onNavigate={() => openHostPath(`/cases/${item.id}`)}>
            {t('investigator.openInCase')}
          </TextLink>
        </Inline>
        {update.isError ? <Alert>{update.error.message}</Alert> : null}

        <FormField label={t('investigator.note')}>
          {(control) => (
            <Textarea
              {...control}
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          )}
        </FormField>
        <Inline>
          <Button
            disabled={note.trim().length === 0 || addNote.isPending}
            onClick={() => addNote.mutate()}
          >
            {t('investigator.addNote')}
          </Button>
        </Inline>
        {addNote.isError ? <Alert>{addNote.error.message}</Alert> : null}
      </Stack>
    </Card>
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
    <TextLink href={BASE} onNavigate={() => navigate('')}>
      ← {t('investigator.back')}
    </TextLink>
  )
  if (detail.isPending) return <LoadingRows />
  if (detail.isError) {
    return (
      <Stack>
        <ErrorState onRetry={() => void detail.refetch()} />
        {back}
      </Stack>
    )
  }

  // Contact details are left out on purpose: the server masks PII per role, and this team's view
  // does not need them.
  const item = detail.data
  return (
    <Stack gap="lg">
      {back}
      <PageHeader title={`${item.code} · ${item.subject}`} description={item.customer.name} />
      <Card>
        <DescriptionList layout="grid">
          <DescriptionItem label={t('investigator.status')}>
            {levelBadge(master.data?.statuses, item.status)}
          </DescriptionItem>
          <DescriptionItem label={t('investigator.priority')}>
            {levelBadge(master.data?.priorities, item.priority)}
          </DescriptionItem>
          <DescriptionItem label={t('investigator.assignee')}>
            {item.assignee?.name ?? t('investigator.unassigned')}
          </DescriptionItem>
          <DescriptionItem label={t('investigator.stt')}>{item.sttNumber ?? '—'}</DescriptionItem>
        </DescriptionList>
      </Card>
      <CaseActions api={api} item={item} master={master.data} openHostPath={openHostPath} />
      <Stack gap="sm">
        <SectionHeading>{t('investigator.timeline')}</SectionHeading>
        <Stack gap="sm" role="list" aria-label={t('investigator.timeline')}>
          {item.timeline.map((entry) => (
            <Card key={entry.id} role="listitem">
              <Stack gap="sm">
                <Inline gap="sm">
                  <strong>{entry.author.name}</strong>
                  {entry.visibility === 'internal' ? (
                    <Badge tone="warning">{t('investigator.internal')}</Badge>
                  ) : null}
                  <time dateTime={entry.createdAt}>
                    {new Date(entry.createdAt).toLocaleString(i18n.language)}
                  </time>
                </Inline>
                {entry.body ? <p>{entry.body}</p> : null}
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}

export function InvestigatorPage({ api, subPath, navigate, openHostPath }: RemotePageProps) {
  const { t } = useTranslation()
  const [section, id] = subPath.split('/')

  let body: ReactNode
  if (subPath === '') {
    body = (
      <Stack gap="lg">
        <PageHeader title={t('investigator.title')} description={t('investigator.intro')} />
        <CaseList api={api} navigate={navigate} />
      </Stack>
    )
  } else if (section === 'case' && id) {
    body = <CaseDetail api={api} navigate={navigate} openHostPath={openHostPath} caseId={id} />
  } else {
    body = (
      <EmptyState title={t('investigator.notFound')} description={t('common.emptyDescription')} />
    )
  }

  return <Page width="lg">{body}</Page>
}

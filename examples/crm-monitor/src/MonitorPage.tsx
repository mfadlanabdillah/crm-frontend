import type { RemotePageProps } from '@crm/module-contract'
import {
  Card,
  EmptyState,
  ErrorState,
  Inline,
  Page,
  PageHeader,
  Skeleton,
  Stack,
  StatCard,
  Table,
  TBody,
  Td,
  TextLink,
  Th,
  THead,
  Tr,
} from '@crm/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

const REFRESH_MS = 30_000

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
  if (summary.isPending || master.isPending) {
    body = (
      <Stack gap="sm" aria-busy="true">
        <Skeleton size="row" />
        <Skeleton size="row" />
      </Stack>
    )
  } else if (summary.isError || master.isError) {
    body = (
      <ErrorState
        onRetry={() => {
          void summary.refetch()
          void master.refetch()
        }}
      />
    )
  } else if (master.data.queues.length === 0) {
    body = <EmptyState title={t('monitor.empty')} description={t('common.emptyDescription')} />
  } else {
    const { queues, unassigned, overdue } = summary.data
    body = (
      <>
        <Inline gap="lg" align="start">
          <StatCard
            label={t('monitor.unassigned')}
            value={
              <TextLink
                href="/cases?view=unassigned"
                onNavigate={() => openHostPath('/cases?view=unassigned')}
              >
                {number.format(unassigned)}
              </TextLink>
            }
          />
          <StatCard label={t('monitor.overdue')} value={number.format(overdue)} />
        </Inline>
        <Card padded={false}>
          <Table aria-label={t('monitor.title')}>
            <THead>
              <Tr>
                <Th>{t('monitor.queue')}</Th>
                <Th>{t('monitor.open')}</Th>
              </Tr>
            </THead>
            <TBody>
              {master.data.queues.map((queue) => (
                <Tr key={queue.code}>
                  <Td>
                    <TextLink
                      href={`/cases?queue=${queue.code}`}
                      onNavigate={() => openHostPath(`/cases?queue=${queue.code}`)}
                    >
                      {queue.label}
                    </TextLink>
                  </Td>
                  <Td>{number.format(queues[queue.code] ?? 0)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </>
    )
  }

  return (
    <Page width="md">
      <Stack gap="lg">
        <PageHeader
          title={t('monitor.title')}
          description={`${t('monitor.intro')} ${t('monitor.refreshed')}`}
        />
        {body}
      </Stack>
    </Page>
  )
}

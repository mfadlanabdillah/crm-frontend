import { formatDateTime } from '@crm/app-kit'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Can, useAuth } from '@crm/auth'
import { ApiError } from '@crm/api-client'
import type { UpdateCaseRequest } from '@crm/api-client'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Card, EmptyState, ErrorState, Select, Skeleton, toast } from '@crm/ui'
import { CasePriorityBadge, CaseStatusBadge } from '@/modules/case/components/CaseBadges'
import { CustomerPanel } from '@/modules/case/components/CustomerPanel'
import { Timeline } from '@/modules/case/components/Timeline'
import { useCase } from '@/modules/case/queries/useCase'
import { useMasterData } from '@/modules/case/queries/useMasterData'
import { useUpdateCase } from '@/modules/case/queries/useUpdateCase'
import { DEFAULT_CASE_SEARCH } from '@/modules/case/schemas/search'
import { useWorkspaceStore } from '@/modules/case/store/workspace'

const route = getRouteApi('/_authenticated/cases/$caseId')

// Tiptap/ProseMirror ~100 KB gzip: dimuat saat halaman detail tampil, bukan saat route di-parse.
const ReplyComposer = lazy(() =>
  import('@/modules/case/components/ReplyComposer').then((m) => ({ default: m.ReplyComposer })),
)

export function CaseDetailPage() {
  const { caseId } = route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const openTab = useWorkspaceStore((state) => state.openTab)
  const { data, isPending, isError, error, refetch } = useCase(caseId)
  const update = useUpdateCase(caseId)
  const apply = (patch: UpdateCaseRequest) =>
    update.mutate(patch, {
      onSuccess: () => toast(t('cases.detail.updated'), { tone: 'success' }),
    })
  const { data: masterData } = useMasterData()

  useEffect(() => {
    if (data?.code) {
      openTab({ caseId, title: data.code })
    }
  }, [caseId, data?.code, openTab])

  const notFound = error instanceof ApiError && error.status === 404

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigate({ to: '/cases', search: DEFAULT_CASE_SEARCH })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('cases.detail.back')}
        </Button>

        {isPending ? (
          <div className="mt-4 space-y-3" aria-busy="true">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <div className="grid gap-6 pt-2 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        ) : isError && notFound ? (
          <EmptyState
            title={t('cases.detail.notFoundTitle')}
            description={t('cases.detail.notFoundDescription')}
          />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : data ? (
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <Card as="header">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-ink-muted">{data.code}</p>
                    <h2 className="mt-0.5 text-lg font-semibold text-ink">{data.subject}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CaseStatusBadge status={data.status} />
                      <CasePriorityBadge priority={data.priority} />
                      <span className="text-xs text-ink-muted">
                        {data.assignee ? data.assignee.name : t('cases.unassigned')}
                      </span>
                    </div>
                  </div>
                </div>

                {data.description ? (
                  <p className="mt-3 text-sm text-ink-muted">{data.description}</p>
                ) : null}

                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
                  <div className="flex gap-1">
                    <dt>{t('cases.updatedAt')}:</dt>
                    <dd>{formatDateTime(data.updatedAt)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>{t('cases.sla')}:</dt>
                    <dd>{formatDateTime(data.slaDueAt)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
                  <label className="flex items-center gap-2 text-xs text-ink-muted">
                    {t('cases.status')}
                    <Select
                      value={data.status}
                      onChange={(event) => apply({ status: event.target.value })}
                      disabled={update.isPending}
                    >
                      {masterData?.statuses.map((status) => (
                        <option key={status.code} value={status.code}>
                          {status.label}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-ink-muted">
                    {t('cases.priority')}
                    <Select
                      value={data.priority}
                      onChange={(event) => apply({ priority: event.target.value })}
                      disabled={update.isPending}
                    >
                      {masterData?.priorities.map((priority) => (
                        <option key={priority.code} value={priority.code}>
                          {priority.label}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <Can permission="case.escalate">
                    <label className="flex items-center gap-2 text-xs text-ink-muted">
                      {t('cases.queue')}
                      <Select
                        value={data.queue}
                        onChange={(event) => apply({ queue: event.target.value })}
                        disabled={update.isPending}
                      >
                        {masterData?.queues.map((queue) => (
                          <option key={queue.code} value={queue.code}>
                            {queue.label}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </Can>

                  <Can permission="case.assign">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={update.isPending || data.assignee?.id === session?.user.id}
                      onClick={() => apply({ assigneeId: session?.user.id ?? null })}
                    >
                      <UserPlus className="size-4" aria-hidden="true" />
                      {t('cases.detail.assignToMe')}
                    </Button>
                  </Can>
                </div>

                {update.isError ? <Alert className="mt-2">{update.error.message}</Alert> : null}
              </Card>

              <Card as="section" aria-labelledby="timeline-heading">
                <h3 id="timeline-heading" className="text-sm font-semibold text-ink">
                  {t('cases.detail.timeline')}
                </h3>
                <div className="mt-4">
                  <Timeline entries={data.timeline} />
                </div>
              </Card>

              {/* `key` me-remount editor per case supaya draft tidak terbawa ke case lain. */}
              <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                <ReplyComposer key={caseId} caseId={caseId} />
              </Suspense>
            </div>

            <CustomerPanel caseItem={data} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

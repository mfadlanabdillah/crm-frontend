import { formatDateTime } from '@crm/app-kit'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DescriptionItem, DescriptionList, ErrorState, Skeleton, buttonVariants } from '@crm/ui'
import { CasePriorityBadge, CaseStatusBadge } from '@/modules/case/components/CaseBadges'
import { useCase } from '@/modules/case/queries/useCase'

/** Read-only summary of a case for the side panel on the list. Edits happen on the detail page. */
export function CasePreview({ caseId }: { caseId: string }) {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useCase(caseId)

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError) return <ErrorState onRetry={() => void refetch()} />

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs text-ink-muted">{data.code}</p>
        <h3 className="mt-0.5 text-base font-semibold text-ink">{data.subject}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CaseStatusBadge status={data.status} />
          <CasePriorityBadge priority={data.priority} />
        </div>
      </div>

      {data.description ? <p className="text-sm text-ink-muted">{data.description}</p> : null}

      <DescriptionList>
        <DescriptionItem label={t('cases.customer')}>{data.customer.name}</DescriptionItem>
        <DescriptionItem label={t('cases.assignee')}>
          {data.assignee ? data.assignee.name : t('cases.unassigned')}
        </DescriptionItem>
        <DescriptionItem label={t('cases.updatedAt')}>
          {formatDateTime(data.updatedAt)}
        </DescriptionItem>
        <DescriptionItem label={t('cases.sla')}>{formatDateTime(data.slaDueAt)}</DescriptionItem>
      </DescriptionList>

      <Link
        to="/cases/$caseId"
        params={{ caseId }}
        className={buttonVariants({ variant: 'secondary', size: 'sm' })}
      >
        {t('cases.preview.openDetail')}
      </Link>
    </div>
  )
}

import { formatNumber } from '@crm/app-kit'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Can, useAuth } from '@crm/auth'
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  buttonVariants,
} from '@crm/ui'
import { CaseFilters } from '@/modules/case/components/CaseFilters'
import { CaseTable } from '@/modules/case/components/CaseTable'
import { useCases } from '@/modules/case/queries/useCases'
import { DEFAULT_CASE_SEARCH, updateCaseSearch } from '@/modules/case/schemas/search'
import type { CaseSearch } from '@/modules/case/schemas/search'
import { searchRoute } from '@/lib/search-route'

const route = searchRoute<CaseSearch>('/_authenticated/cases')

const SKELETON_ROWS = Array.from({ length: 8 }, (_, index) => index)

export function CaseListPage() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isPending, isError, isFetching, refetch } = useCases(search)

  const onChange = (patch: Partial<CaseSearch>) => {
    void navigate({ search: (prev) => updateCaseSearch(prev, patch) })
  }

  const goToPage = (page: number) => {
    void navigate({ search: (prev) => ({ ...prev, page }) })
  }

  const meta = data?.meta

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border-subtle bg-surface-raised px-6 py-4">
        <PageHeader
          className="mb-3"
          title={t('cases.title')}
          description={t('cases.subtitle')}
          actions={
            <>
              <Can permission="case.create">
                <Link to="/cases/new" className={buttonVariants({ size: 'sm' })}>
                  {t('cases.create.open')}
                </Link>
              </Can>
              {meta ? (
                <p className="text-xs text-ink-muted tabular-nums">
                  {t('cases.total', { total: formatNumber(meta.total) })}
                </p>
              ) : null}
            </>
          }
        />

        <CaseFilters
          search={search}
          data={data}
          onChange={onChange}
          onReset={() => void navigate({ search: DEFAULT_CASE_SEARCH })}
        />
      </div>

      <div className="min-h-0 flex-1">
        {isPending ? (
          <div className="space-y-2 p-6" aria-busy="true">
            {SKELETON_ROWS.map((row) => (
              <Skeleton key={row} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title={t('cases.emptyTitle')}
            description={t('cases.emptyDescription')}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void navigate({ search: DEFAULT_CASE_SEARCH })}
              >
                {t('common.clear')}
              </Button>
            }
          />
        ) : data ? (
          <CaseTable cases={data.items} role={role} isFetching={isFetching} />
        ) : null}
      </div>

      <Pagination page={search.page} totalPages={meta?.totalPages ?? 1} onPageChange={goToPage}>
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          {t('common.rowsPerPage')}
          <Select
            value={search.pageSize}
            onChange={(event) => onChange({ pageSize: Number(event.target.value) })}
            className="h-7 rounded-md bg-surface px-1.5 text-xs"
          >
            {[25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>
      </Pagination>
    </div>
  )
}

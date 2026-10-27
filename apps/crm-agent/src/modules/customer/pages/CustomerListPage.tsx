import { Link, getRouteApi } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { maskEmail, maskPhone, useAuth } from '@crm/auth'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/data-state'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/format'
import { useCustomers } from '@/modules/customer/queries/useCustomers'
import { CustomerSegmentBadge } from '@/modules/customer/components/CustomerSegmentBadge'

const route = getRouteApi('/_authenticated/customers/')

const SKELETON_ROWS = Array.from({ length: 8 }, (_, index) => index)

export function CustomerListPage() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isPending, isError, refetch } = useCustomers(search)

  const meta = data?.meta
  const canGoBack = search.page > 1
  const canGoForward = meta ? search.page < meta.totalPages : false

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border-subtle bg-surface-raised px-6 py-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-ink">{t('customer.title')}</h2>
            <p className="text-xs text-ink-muted">{t('customer.subtitle')}</p>
          </div>
          {meta ? (
            <p className="text-xs text-ink-muted tabular-nums">
              {t('customer.total', { total: formatNumber(meta.total) })}
            </p>
          ) : null}
        </div>

        <form
          role="search"
          className="flex max-w-md items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const value = String(new FormData(event.currentTarget).get('q') ?? '').trim()
            void navigate({ search: { q: value || undefined, page: 1 } })
          }}
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              key={search.q ?? 'empty'}
              name="q"
              defaultValue={search.q ?? ''}
              placeholder={t('customer.searchPlaceholder')}
              aria-label={t('customer.searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            {t('common.search')}
          </Button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <div className="space-y-2 p-6" aria-busy="true">
            {SKELETON_ROWS.map((row) => (
              <Skeleton key={row} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : data && data.items.length === 0 ? (
          <EmptyState title={t('common.emptyTitle')} description={t('common.emptyDescription')} />
        ) : data ? (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface-raised text-xs text-ink-muted uppercase">
              <tr className="border-b border-border-subtle">
                <th scope="col" className="px-6 py-2 font-medium">
                  {t('customer.name')}
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  {t('customer.segment')}
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  {t('customer.city')}
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  {t('customer.phone')}
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  {t('customer.email')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border-subtle hover:bg-surface-muted"
                >
                  <td className="px-6 py-2">
                    <Link
                      to="/customers/$customerId"
                      params={{ customerId: customer.id }}
                      className="font-medium text-brand-strong hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <CustomerSegmentBadge segment={customer.segment} />
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{customer.city}</td>
                  <td className="px-3 py-2 font-mono text-xs">{maskPhone(customer.phone, role)}</td>
                  <td className="px-3 py-2 text-xs break-all">{maskEmail(customer.email, role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle bg-surface-raised px-6 py-2">
        <p className="text-xs text-ink-muted tabular-nums">
          {meta
            ? t('customer.pageOf', {
                page: formatNumber(meta.page),
                totalPages: formatNumber(Math.max(1, meta.totalPages)),
              })
            : null}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              void navigate({ search: (prev) => ({ ...prev, page: search.page - 1 }) })
            }
            disabled={!canGoBack}
          >
            {t('common.previous')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              void navigate({ search: (prev) => ({ ...prev, page: search.page + 1 }) })
            }
            disabled={!canGoForward}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}

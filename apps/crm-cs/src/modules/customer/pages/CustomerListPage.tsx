import { formatNumber } from '@crm/app-kit'
import { Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { maskEmail, maskPhone, useAuth } from '@crm/auth'
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  textLinkClasses,
} from '@crm/ui'
import { useCustomers } from '@/modules/customer/queries/useCustomers'
import { CustomerSegmentBadge } from '@/modules/customer/components/CustomerSegmentBadge'
import { searchRoute } from '@/lib/search-route'
import type { CustomerSearch } from '@/modules/customer/schemas/search'

const route = searchRoute<CustomerSearch>('/_authenticated/customers')

const SKELETON_ROWS = Array.from({ length: 8 }, (_, index) => index)

export function CustomerListPage() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isPending, isError, refetch } = useCustomers(search)

  const meta = data?.meta

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border-subtle bg-surface-raised px-6 py-4">
        <PageHeader
          className="mb-3"
          title={t('customer.title')}
          description={t('customer.subtitle')}
          actions={
            meta ? (
              <p className="text-xs text-ink-muted tabular-nums">
                {t('customer.total', { total: formatNumber(meta.total) })}
              </p>
            ) : null
          }
        />

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
          <Table>
            <THead>
              <Tr>
                <Th>{t('customer.name')}</Th>
                <Th>{t('customer.segment')}</Th>
                <Th>{t('customer.city')}</Th>
                <Th>{t('customer.phone')}</Th>
                <Th>{t('customer.email')}</Th>
              </Tr>
            </THead>
            <TBody>
              {data.items.map((customer) => (
                <Tr key={customer.id}>
                  <Td>
                    <Link
                      to="/customers/$customerId"
                      params={{ customerId: customer.id }}
                      className={textLinkClasses}
                    >
                      {customer.name}
                    </Link>
                  </Td>
                  <Td>
                    <CustomerSegmentBadge segment={customer.segment} />
                  </Td>
                  <Td className="text-ink-muted">{customer.city}</Td>
                  <Td className="font-mono text-xs">{maskPhone(customer.phone, role)}</Td>
                  <Td className="text-xs break-all">{maskEmail(customer.email, role)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : null}
      </div>

      <Pagination
        page={search.page}
        totalPages={meta?.totalPages ?? 1}
        onPageChange={(page) => void navigate({ search: (prev) => ({ ...prev, page }) })}
      />
    </div>
  )
}

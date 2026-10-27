import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@crm/api-client'
import { maskAddress, maskEmail, maskPhone, useAuth } from '@crm/auth'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/data-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { CustomerSegmentBadge } from '@/modules/customer/components/CustomerSegmentBadge'
import { useCustomer } from '@/modules/customer/queries/useCustomer'
import { DEFAULT_CUSTOMER_SEARCH } from '@/modules/customer/schemas/search'

const route = getRouteApi('/_authenticated/customers/$customerId')

export function CustomerDetailPage() {
  const { customerId } = route.useParams()
  const { t } = useTranslation()
  const { role } = useAuth()
  const navigate = useNavigate()
  const { data, isPending, isError, error, refetch } = useCustomer(customerId)
  const notFound = error instanceof ApiError && error.status === 404

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigate({ to: '/customers', search: DEFAULT_CUSTOMER_SEARCH })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('customer.back')}
        </Button>

        {isPending ? (
          <div className="mt-4 space-y-3" aria-busy="true">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError && notFound ? (
          <EmptyState
            title={t('customer.notFoundTitle')}
            description={t('customer.notFoundDescription')}
          />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : data ? (
          <section className="mt-4 rounded-xl border border-border-subtle bg-surface-raised p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">{data.name}</h2>
              <CustomerSegmentBadge segment={data.segment} />
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                  {t('customer.phone')}
                </dt>
                <dd className="text-ink">{maskPhone(data.phone, role)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                  {t('customer.email')}
                </dt>
                <dd className="break-all text-ink">{maskEmail(data.email, role)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                  {t('customer.address')}
                </dt>
                <dd className="text-ink">{maskAddress(data.address, role)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                  {t('customer.city')}
                </dt>
                <dd className="text-ink">{data.city}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                  {t('customer.createdAt')}
                </dt>
                <dd className="text-ink">{formatDateTime(data.createdAt)}</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  )
}

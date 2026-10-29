import { formatDateTime } from '@crm/app-kit'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@crm/api-client'
import { maskAddress, maskEmail, maskPhone, useAuth } from '@crm/auth'
import {
  Button,
  Card,
  DescriptionItem,
  DescriptionList,
  EmptyState,
  ErrorState,
  Page,
  Skeleton,
} from '@crm/ui'
import { useMasterData } from '@/modules/case/public'
import { CustomerCaseList } from '@/modules/customer/components/CustomerCaseList'
import { CustomerSegmentBadge } from '@/modules/customer/components/CustomerSegmentBadge'
import { useCustomer } from '@/modules/customer/queries/useCustomer'
import { useCustomerCases } from '@/modules/customer/queries/useCustomerCases'
import { DEFAULT_CUSTOMER_SEARCH } from '@/modules/customer/schemas/search'

const route = getRouteApi('/_authenticated/customers/$customerId')

export function CustomerDetailPage() {
  const { customerId } = route.useParams()
  const { t } = useTranslation()
  const { role } = useAuth()
  const navigate = useNavigate()
  const { data, isPending, isError, error, refetch } = useCustomer(customerId)
  const notFound = error instanceof ApiError && error.status === 404
  const customerCases = useCustomerCases(customerId)
  const { data: masterData } = useMasterData()
  const statusLabel = (code: string) =>
    masterData?.statuses.find((status) => status.code === code)?.label ?? code

  return (
    <Page>
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
        <Card as="section" className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-ink">{data.name}</h2>
            <CustomerSegmentBadge segment={data.segment} />
          </div>
          <DescriptionList layout="grid" className="mt-4">
            <DescriptionItem label={t('customer.phone')}>
              {maskPhone(data.phone, role)}
            </DescriptionItem>
            <DescriptionItem label={t('customer.email')} valueClassName="break-all">
              {maskEmail(data.email, role)}
            </DescriptionItem>
            <DescriptionItem label={t('customer.address')} className="sm:col-span-2">
              {maskAddress(data.address, role)}
            </DescriptionItem>
            <DescriptionItem label={t('customer.city')}>{data.city}</DescriptionItem>
            <DescriptionItem label={t('customer.createdAt')}>
              {formatDateTime(data.createdAt)}
            </DescriptionItem>
          </DescriptionList>
        </Card>
      ) : null}

      {data ? (
        <Card as="section" className="mt-4">
          <h3 className="text-sm font-semibold text-ink">{t('customer.cases.title')}</h3>
          {customerCases.isPending ? (
            <Skeleton className="mt-2 h-10 w-full" />
          ) : customerCases.isError ? (
            <ErrorState onRetry={() => void customerCases.refetch()} />
          ) : (
            <CustomerCaseList items={customerCases.data.items} statusLabel={statusLabel} />
          )}
        </Card>
      ) : null}
    </Page>
  )
}

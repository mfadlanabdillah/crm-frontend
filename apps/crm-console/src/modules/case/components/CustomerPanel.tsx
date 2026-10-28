import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { Case } from '@crm/api-client'
import { Can, maskAddress, maskEmail, maskPhone, useAuth } from '@crm/auth'
import { Badge, Card, DescriptionItem, DescriptionList } from '@crm/ui'

export function CustomerPanel({ caseItem }: { caseItem: Case }) {
  const { t } = useTranslation()
  const { role } = useAuth()
  const { customer } = caseItem
  const tags = caseItem.tags ?? []

  return (
    <Card as="aside" className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">{t('cases.detail.customerPanel')}</h2>
        <p className="mt-1 text-base font-medium text-ink">{customer.name}</p>
        {/* Tautan lintas modul lewat route, bukan impor kode dari modul customer. */}
        <Can permission="customer.view">
          <Link
            to="/customers/$customerId"
            params={{ customerId: customer.id }}
            className="mt-1 inline-block text-xs text-brand-strong hover:underline"
          >
            {t('cases.detail.viewCustomer')}
          </Link>
        </Can>
      </div>

      <DescriptionList>
        <DescriptionItem label="Telepon">{maskPhone(customer.phone, role)}</DescriptionItem>
        <DescriptionItem label="Email" valueClassName="break-all">
          {maskEmail(customer.email, role)}
        </DescriptionItem>
        <DescriptionItem label="Alamat">{maskAddress(customer.address, role)}</DescriptionItem>
        <DescriptionItem label={t('cases.detail.stt')} valueClassName="font-mono text-xs">
          {caseItem.sttNumber ?? '—'}
        </DescriptionItem>
        <DescriptionItem label={t('cases.detail.shipment')} valueClassName="font-mono text-xs">
          {caseItem.shipmentId ?? '—'}
        </DescriptionItem>
      </DescriptionList>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} tone="info">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </Card>
  )
}

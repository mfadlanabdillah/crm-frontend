import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { Case } from '@crm/api-client'
import { Can, maskAddress, maskEmail, maskPhone, useAuth } from '@crm/auth'
import { Badge } from '@/components/ui/badge'

export function CustomerPanel({ caseItem }: { caseItem: Case }) {
  const { t } = useTranslation()
  const { role } = useAuth()
  const { customer } = caseItem
  const tags = caseItem.tags ?? []

  return (
    <aside className="space-y-4 rounded-xl border border-border-subtle bg-surface-raised p-4">
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

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">Telepon</dt>
          <dd className="text-ink">{maskPhone(customer.phone, role)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">Email</dt>
          <dd className="break-all text-ink">{maskEmail(customer.email, role)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">Alamat</dt>
          <dd className="text-ink">{maskAddress(customer.address, role)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">
            {t('cases.detail.stt')}
          </dt>
          <dd className="font-mono text-xs text-ink">{caseItem.sttNumber ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">
            {t('cases.detail.shipment')}
          </dt>
          <dd className="font-mono text-xs text-ink">{caseItem.shipmentId ?? '—'}</dd>
        </div>
      </dl>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} tone="info">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </aside>
  )
}

import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { Case } from '@crm/api-client'
import { formatDateTime } from '@/lib/format'

interface CustomerCaseListProps {
  items: Case[]
  /** Maps a status code to its display label (from master data); unknown codes show as they are. */
  statusLabel: (code: string) => string
}

/** Case history of one customer. Links go through the route: no import from the case module. */
export function CustomerCaseList({ items, statusLabel }: CustomerCaseListProps) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return <p className="mt-2 text-sm text-ink-muted">{t('customer.cases.empty')}</p>
  }

  return (
    <ul className="mt-2 divide-y divide-border-subtle text-sm">
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <div>
            <Link
              to="/cases/$caseId"
              params={{ caseId: item.id }}
              className="font-medium text-brand-strong hover:underline"
            >
              {item.code}
            </Link>
            <span className="ml-2 text-ink">{item.subject}</span>
          </div>
          <div className="flex gap-3 text-xs text-ink-muted">
            <span>{statusLabel(item.status)}</span>
            <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
          </div>
        </li>
      ))}
    </ul>
  )
}

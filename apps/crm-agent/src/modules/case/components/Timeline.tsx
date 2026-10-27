import { useTranslation } from 'react-i18next'
import type { TimelineEntry } from '@crm/api-client'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, initials } from '@/lib/format'
import { stripHtml } from '@/lib/text'

function entryTone(entry: TimelineEntry): 'info' | 'warning' | 'neutral' {
  if (entry.type === 'reply') return 'info'
  if (entry.visibility === 'internal') return 'warning'
  return 'neutral'
}

function entryLabel(entry: TimelineEntry, t: (key: string) => string): string {
  if (entry.type === 'reply') return t('cases.detail.replyToCustomer')
  if (entry.type === 'status_change') return t('cases.detail.statusUpdated')
  if (entry.type === 'assignment') return t('cases.detail.reassign')
  return t('cases.detail.internalNote')
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const { t } = useTranslation()

  if (entries.length === 0) {
    return <p className="text-sm text-ink-muted">{t('common.emptyTitle')}</p>
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-strong"
          >
            {initials(entry.author.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-ink">{entry.author.name}</p>
              <Badge tone={entryTone(entry)}>{entryLabel(entry, t)}</Badge>
              <time dateTime={entry.createdAt} className="text-xs text-ink-muted">
                {formatDateTime(entry.createdAt)}
              </time>
            </div>
            {entry.body ? (
              // Body dari editor rich text. Untuk skeleton ditampilkan sebagai teks;
              // render HTML butuh sanitasi di server/BFF sebelum diaktifkan.
              <p className="mt-1 text-sm whitespace-pre-wrap text-ink-muted">
                {stripHtml(entry.body)}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}

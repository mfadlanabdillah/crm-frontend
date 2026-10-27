import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CaseListResponse } from '@crm/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatNumber } from '@/lib/format'
import { useMasterData } from '../queries/useMasterData'
import type { CaseSearch } from '../schemas/search'

interface CaseFiltersProps {
  search: CaseSearch
  data: CaseListResponse | undefined
  onChange: (patch: Partial<CaseSearch>) => void
  onReset: () => void
}

export function CaseFilters({ search, data, onChange, onReset }: CaseFiltersProps) {
  const { t } = useTranslation()
  const { data: masterData } = useMasterData()
  const hasFilters = Boolean(search.q || search.status || search.queue)

  return (
    <form
      role="search"
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const value = String(new FormData(event.currentTarget).get('q') ?? '').trim()
        onChange({ q: value || undefined })
      }}
    >
      <div className="relative min-w-56 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <Input
          // `key` me-reset input saat URL berubah lewat back/forward atau clear.
          key={search.q ?? 'empty'}
          name="q"
          defaultValue={search.q ?? ''}
          placeholder={t('cases.searchPlaceholder')}
          aria-label={t('cases.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      <Select
        aria-label={t('cases.status')}
        value={search.status ?? ''}
        onChange={(event) =>
          onChange({
            status: event.target.value || undefined,
          })
        }
      >
        <option value="">{t('cases.allStatuses')}</option>
        {masterData?.statuses.map((status) => (
          <option key={status.code} value={status.code}>
            {status.label}
          </option>
        ))}
      </Select>

      <Select
        aria-label={t('cases.queue')}
        value={search.queue ?? ''}
        onChange={(event) =>
          onChange({
            queue: event.target.value || undefined,
          })
        }
      >
        <option value="">{t('cases.allQueues')}</option>
        {masterData?.queues.map((queue) => (
          <option key={queue.code} value={queue.code}>
            {queue.label}
          </option>
        ))}
      </Select>

      <Button type="submit" variant="secondary" size="sm">
        {t('common.search')}
      </Button>

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={() => onReset()}>
          <X className="size-4" aria-hidden="true" />
          {t('common.clear')}
        </Button>
      ) : null}

      <p className="ml-auto text-xs text-ink-muted tabular-nums" aria-live="polite">
        {t('cases.total', { total: formatNumber(data?.meta.total ?? 0) })}
      </p>
    </form>
  )
}

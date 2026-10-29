import { formatNumber } from '@crm/app-kit'
import { cn } from '@crm/ui'
import { Link } from '@tanstack/react-router'
import { Inbox, Layers, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCaseSummary } from '@/modules/case/queries/useCaseSummary'
import { useMasterData } from '@/modules/case/queries/useMasterData'
import { DEFAULT_CASE_SEARCH } from '@/modules/case/schemas/search'
import type { CaseSearch } from '@/modules/case/schemas/search'

interface NavItem {
  key: string
  label: string
  icon: LucideIcon
  search: CaseSearch
  count?: number
}

const itemBase = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors'
const itemIdle = 'text-ink-muted hover:bg-surface-muted hover:text-ink'
const itemActive = 'bg-brand-soft font-medium text-brand-strong'

export function QueueNav({ variant = 'sidebar' }: { variant?: 'sidebar' | 'inline' }) {
  const { t } = useTranslation()
  const { data: summary } = useCaseSummary()
  const { data: masterData } = useMasterData()

  const items: NavItem[] = [
    {
      key: 'unassigned',
      label: t('nav.unassigned'),
      icon: Inbox,
      search: { ...DEFAULT_CASE_SEARCH, view: 'unassigned' },
      count: summary?.unassigned,
    },
    ...(masterData?.queues ?? []).map((queue) => ({
      key: queue.code,
      label: queue.label,
      icon: Layers,
      search: { ...DEFAULT_CASE_SEARCH, queue: queue.code },
      count: summary?.queues[queue.code],
    })),
    {
      key: 'mine',
      label: t('nav.myCases'),
      icon: UserRound,
      search: { ...DEFAULT_CASE_SEARCH, view: 'mine' },
    },
    {
      key: 'all',
      label: t('nav.allCases'),
      icon: Inbox,
      search: DEFAULT_CASE_SEARCH,
    },
  ]

  return (
    <nav
      aria-label={t('nav.inbox')}
      className={cn(
        variant === 'sidebar'
          ? 'flex flex-col gap-0.5 p-3'
          : 'flex gap-1 overflow-x-auto px-3 py-2',
      )}
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.key}
            to="/cases"
            search={item.search}
            activeOptions={{ includeSearch: true }}
            className={cn(itemBase, itemIdle, variant === 'inline' && 'shrink-0 px-2.5 py-1.5')}
            activeProps={{
              className: cn(itemBase, itemActive, variant === 'inline' && 'shrink-0 px-2.5 py-1.5'),
            }}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
            {typeof item.count === 'number' && item.count > 0 ? (
              <span className="ml-auto rounded-full bg-surface-raised px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted tabular-nums">
                {formatNumber(item.count)}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { cn } from './cn'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Extra controls on the left, next to the page summary (for example a page-size select). */
  children?: ReactNode
  className?: string
}

/** Previous and next with a "page X of Y" summary. The page lives in the URL; this only reports. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  children,
  className,
}: PaginationProps) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language)
  const last = Math.max(1, totalPages)

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle bg-surface-raised px-6 py-2',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <p className="text-xs text-ink-muted tabular-nums">
          {t('common.pageOf', { page: number.format(page), totalPages: number.format(last) })}
        </p>
        {children}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('common.previous')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= last}
          onClick={() => onPageChange(page + 1)}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  )
}

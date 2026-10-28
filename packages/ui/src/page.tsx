import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

const widths = { sm: 'max-w-xl', md: 'max-w-3xl', lg: 'max-w-6xl' } as const

/** A scrollable page body with a readable width. Pages that manage their own layout skip it. */
export function Page({
  width = 'md',
  className,
  children,
}: {
  width?: keyof typeof widths
  className?: string
  children: ReactNode
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className={cn('mx-auto p-6', widths[width], className)}>{children}</div>
    </div>
  )
}

/** The title block of a page: a heading, one line that says what the page is for, and actions. */
export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-2', className)} {...props}>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="text-xs text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}

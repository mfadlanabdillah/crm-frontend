import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

const layouts = {
  stack: 'space-y-3',
  grid: 'grid gap-4 sm:grid-cols-2',
} as const

/** Label and value pairs (a profile, a summary). Use instead of hand-styled `dt`/`dd`. */
export function DescriptionList({
  layout = 'stack',
  className,
  ...props
}: HTMLAttributes<HTMLDListElement> & { layout?: keyof typeof layouts }) {
  return <dl className={cn('text-sm', layouts[layout], className)} {...props} />
}

export function DescriptionItem({
  label,
  children,
  className,
  valueClassName,
}: {
  label: ReactNode
  children: ReactNode
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">{label}</dt>
      <dd className={cn('text-ink', valueClassName)}>{children}</dd>
    </div>
  )
}

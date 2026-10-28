import type { HTMLAttributes } from 'react'
import { cn } from './cn'

/**
 * The heading of a section inside a page (the page title is `PageHeader`). Choose the level for the
 * document outline; the look is the same.
 */
export function SectionHeading({
  as: Tag = 'h3',
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }) {
  return <Tag className={cn('text-sm font-semibold text-ink', className)} {...props} />
}

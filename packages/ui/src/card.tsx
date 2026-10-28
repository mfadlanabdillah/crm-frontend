import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** The element to render: use a landmark-friendly tag when the card is a region of its own. */
  as?: 'div' | 'section' | 'aside' | 'header' | 'article'
  /** Default inner padding; turn off when the content brings its own (tables, editors). */
  padded?: boolean
}

/** The bordered surface that groups related content. */
export function Card({ as: Tag = 'div', padded = true, className, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-border-subtle bg-surface-raised',
        padded && 'p-4',
        className,
      )}
      {...props}
    />
  )
}

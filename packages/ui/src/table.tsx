import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, TableHTMLAttributes } from 'react'
import { cn } from './cn'

/**
 * Styled table elements for simple, paged data. A table with thousands of rows is virtualized and
 * lives with the feature that needs it; do not stretch these for that.
 */
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full text-left text-sm', className)} {...props} />
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('sticky top-0 bg-surface-raised text-xs text-ink-muted uppercase', className)}
      {...props}
    />
  )
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&>tr:hover]:bg-surface-muted', className)} {...props} />
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-border-subtle', className)} {...props} />
}

export function Th({ className, scope = 'col', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope={scope} className={cn('px-3 py-2 font-medium first:px-6', className)} {...props} />
  )
}

export function Td({
  nowrap = false,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { nowrap?: boolean }) {
  return (
    <td
      className={cn('px-3 py-2 first:px-6', nowrap && 'whitespace-nowrap', className)}
      {...props}
    />
  )
}

import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 rounded-lg border border-border-subtle bg-surface-raised px-2.5 text-sm text-ink focus:border-brand focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

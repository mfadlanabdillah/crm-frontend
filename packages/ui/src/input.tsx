import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'

export function Input({
  className,
  type = 'search',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'h-9 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

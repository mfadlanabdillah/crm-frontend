import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    />
  )
}

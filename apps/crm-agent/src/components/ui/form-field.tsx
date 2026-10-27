import { useId } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface FieldControlProps {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': boolean
}

/**
 * Label, hint, and error wired to one control: the control gets `id`, `aria-invalid`, and
 * `aria-describedby` (hint + error) through the render prop. Knows nothing about form libraries.
 */
export function FormField({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string
  hint?: string
  error?: string | undefined
  className?: string
  children: (control: FieldControlProps) => ReactNode
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': Boolean(error),
      })}
      {hint ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

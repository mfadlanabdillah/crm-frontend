import type { HTMLAttributes } from 'react'
import { cn } from './cn'

const tones = {
  danger: 'text-danger',
  warning: 'text-warning-ink',
  success: 'text-success-ink',
  info: 'text-ink-muted',
} as const

/**
 * A short message that belongs to the content next to it (a failed save, a saved confirmation).
 * Errors interrupt the reader (`role="alert"`); the rest are announced politely (`role="status"`).
 * Say what went wrong and what to do; do not apologize.
 */
export function Alert({
  tone = 'danger',
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { tone?: keyof typeof tones }) {
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('text-sm', tones[tone], className)}
      {...props}
    />
  )
}

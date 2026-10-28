import type { HTMLAttributes } from 'react'
import { cn } from './cn'

const gaps = { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' } as const

export type Gap = keyof typeof gaps

/** Children one under the other with an even gap. Use instead of margins between siblings. */
export function Stack({
  gap = 'md',
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { gap?: Gap }) {
  return <div className={cn('flex flex-col', gaps[gap], className)} {...props} />
}

const aligns = { start: 'items-start', center: 'items-center', end: 'items-end' } as const
const justifies = {
  start: 'justify-start',
  between: 'justify-between',
  end: 'justify-end',
} as const

/** Children side by side; they wrap when the row is full. */
export function Inline({
  gap = 'md',
  align = 'center',
  justify = 'start',
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  gap?: Gap
  align?: keyof typeof aligns
  justify?: keyof typeof justifies
}) {
  return (
    <div
      className={cn('flex flex-wrap', gaps[gap], aligns[align], justifies[justify], className)}
      {...props}
    />
  )
}

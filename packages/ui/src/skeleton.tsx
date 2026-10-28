import { cn } from './cn'

const sizes = { text: 'h-4 w-full', row: 'h-10 w-full', block: 'h-40 w-full' } as const

/** A loading placeholder. Pick a preset `size`, or shape it with `className` when none fits. */
export function Skeleton({ size, className }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-muted', size && sizes[size], className)}
    />
  )
}

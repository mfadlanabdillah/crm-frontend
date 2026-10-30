import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  /** Shown to the right of the trigger while it is hovered or has focus. */
  label: string
  /** Renders the trigger alone, for when the label is already visible. */
  disabled?: boolean
}

/**
 * A visual hint for a trigger whose text is hidden, such as an icon-only menu item. The trigger must
 * already have an accessible name: the bubble repeats it, so it is hidden from assistive technology.
 * It is CSS only, which means Escape does not dismiss it; do not use it for information the trigger
 * does not already carry.
 */
export function Tooltip({ label, disabled = false, className, children, ...props }: TooltipProps) {
  return (
    <span className={cn('group/tooltip relative block', className)} {...props}>
      {children}
      {disabled ? null : (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-lg bg-ink px-2 py-1 text-xs whitespace-nowrap text-surface-raised opacity-0 transition-opacity duration-(--motion-fast) ease-(--motion-ease) group-focus-within/tooltip:opacity-100 group-hover/tooltip:opacity-100"
        >
          {label}
        </span>
      )}
    </span>
  )
}

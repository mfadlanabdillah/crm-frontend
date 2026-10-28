import { cn } from './cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

/**
 * A short either/or choice that changes how the content below behaves (who sees a reply). Each
 * option is a toggle button (`aria-pressed`). For more than a handful of options use a Select.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  'aria-label': ariaLabel,
  className,
}: {
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
  'aria-label': string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex rounded-lg bg-surface-muted p-0.5', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium',
            value === option.value ? 'bg-surface-raised text-ink shadow-sm' : 'text-ink-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

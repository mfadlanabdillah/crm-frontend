import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { cn } from './cn'
import { dismissToast, getToasts, subscribe } from './toast-store'
import type { ToastEntry, ToastTone } from './toast-store'

const tones = {
  success: { Icon: CircleCheck, icon: 'text-success' },
  info: { Icon: Info, icon: 'text-brand' },
  warning: { Icon: TriangleAlert, icon: 'text-warning' },
  danger: { Icon: CircleAlert, icon: 'text-danger' },
} as const

export interface ToastCardProps extends HTMLAttributes<HTMLDivElement> {
  message: string
  tone?: ToastTone
  /** Leaving: it fades out and is hidden from assistive technology until it is removed. */
  closing?: boolean
  closeLabel: string
  onClose: () => void
}

/**
 * One notification. Errors interrupt the reader (`role="alert"`); the rest are announced politely
 * (`role="status"`), like `Alert`. It enters and leaves with the motion tokens, and the global
 * reduced-motion rule cuts both to one frame.
 */
export function ToastCard({
  message,
  tone = 'info',
  closing = false,
  closeLabel,
  onClose,
  className,
  ...props
}: ToastCardProps) {
  const { Icon, icon } = tones[tone]

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      aria-hidden={closing || undefined}
      className={cn(
        'pointer-events-auto flex w-80 max-w-full items-start gap-3 rounded-xl border border-border-subtle bg-surface-raised p-3 text-sm text-ink',
        'transition-[opacity,translate] duration-(--motion-base) ease-(--motion-ease) starting:translate-y-2 starting:opacity-0',
        closing && 'translate-y-2 opacity-0',
        className,
      )}
      {...props}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', icon)} aria-hidden="true" />
      <p className="min-w-0 flex-1">{message}</p>
      <Button
        variant="ghost"
        size="icon"
        className="-m-1.5 size-8 shrink-0"
        aria-label={closeLabel}
        tabIndex={closing ? -1 : undefined}
        onClick={onClose}
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

function ToastItem({ entry }: { entry: ToastEntry }) {
  const { t } = useTranslation()
  // Hovering or focusing a toast stops its timer so it cannot vanish while being read or used.
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (entry.duration === null || entry.closing || paused) return
    const timer = setTimeout(() => dismissToast(entry.id), entry.duration)
    return () => clearTimeout(timer)
  }, [entry.duration, entry.closing, entry.id, paused])

  return (
    <ToastCard
      message={entry.message}
      tone={entry.tone}
      closing={entry.closing}
      closeLabel={t('common.close')}
      onClose={() => dismissToast(entry.id)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    />
  )
}

/** Mount once, in the app shell. Remotes call `toast()`: `@crm/ui` is a shared singleton. */
export function Toaster() {
  const { t } = useTranslation()
  const entries = useSyncExternalStore(subscribe, getToasts, getToasts)

  return (
    <section
      aria-label={t('common.notifications')}
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2"
    >
      {entries.map((entry) => (
        <ToastItem key={entry.id} entry={entry} />
      ))}
    </section>
  )
}

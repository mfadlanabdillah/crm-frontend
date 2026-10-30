import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { Button } from './button'
import { cn } from './cn'

export interface DrawerProps {
  title: string
  /** Accessible name of the close button. */
  closeLabel: string
  onClose: () => void
  className?: string
  children: ReactNode
}

/**
 * A side panel on a native modal `<dialog>`: the browser traps focus, makes the page inert, closes on
 * Escape, and returns focus to the trigger. Mount it to open it and unmount it in `onClose`.
 * shortcut: no exit animation because it unmounts on close, upgrade if leaving needs to move too.
 */
export function Drawer({ title, closeLabel, onClose, className, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    // The panel has no padding of its own, so a click that lands on the dialog element is a click on
    // the backdrop. Escape is the keyboard path, which is why this is not a JSX handler.
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close()
    }
    dialog.addEventListener('click', closeOnBackdrop)
    return () => dialog.removeEventListener('click', closeOnBackdrop)
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className={cn(
        'fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-md animate-drawer-in border-l border-border-subtle bg-surface-raised p-0 text-ink shadow-xl backdrop:bg-ink/40',
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
          <h2 id={titleId} className="min-w-0 truncate text-sm font-semibold">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label={closeLabel}
            onClick={() => ref.current?.close()}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </dialog>
  )
}

export type ToastTone = 'success' | 'info' | 'warning' | 'danger'

export interface ToastEntry {
  id: number
  message: string
  tone: ToastTone
  /** Milliseconds before it dismisses itself; `null` stays until the agent closes it. */
  duration: number | null
  closing: boolean
}

export interface ToastOptions {
  tone?: ToastTone
  duration?: number | null
}

const DEFAULT_DURATION = 5000
const MAX_VISIBLE = 5
// Time the exit transition gets before the entry is removed. Keep it a little above --motion-base.
const EXIT_MS = 250

let entries: readonly ToastEntry[] = []
let nextId = 1
const listeners = new Set<() => void>()

function commit(next: readonly ToastEntry[]) {
  entries = next
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getToasts = () => entries

/**
 * Shows a short confirmation. Errors stay until closed because a reader may need more than five
 * seconds to act on them; everything else dismisses itself. Mount one `Toaster` for the page.
 */
export function toast(message: string, options: ToastOptions = {}): number {
  const tone = options.tone ?? 'info'
  const id = nextId++
  const entry: ToastEntry = {
    id,
    message,
    tone,
    duration:
      options.duration !== undefined
        ? options.duration
        : tone === 'danger'
          ? null
          : DEFAULT_DURATION,
    closing: false,
  }
  commit([...entries, entry].slice(-MAX_VISIBLE))
  return id
}

export function dismissToast(id: number) {
  const target = entries.find((entry) => entry.id === id)
  if (!target || target.closing) return
  commit(entries.map((entry) => (entry.id === id ? { ...entry, closing: true } : entry)))
  setTimeout(() => commit(entries.filter((entry) => entry.id !== id)), EXIT_MS)
}

export function clearToasts() {
  commit([])
}

const TIME_ZONE = 'Asia/Jakarta'

const DEFAULT_LOCALE = 'id-ID'

/** Locale follows `<html lang>` (set per entrypoint); falls back to id-ID. */
const locale = () =>
  (typeof document === 'undefined' ? '' : document.documentElement.lang) || DEFAULT_LOCALE

const cache = new Map<string, unknown>()
function memo<T>(key: string, create: (locale: string) => T): T {
  const id = `${key}:${locale()}`
  if (!cache.has(id)) cache.set(id, create(locale()))
  return cache.get(id) as T
}

const dateTimeFormatter = () =>
  memo(
    'dt',
    (l) =>
      new Intl.DateTimeFormat(l, { dateStyle: 'medium', timeStyle: 'short', timeZone: TIME_ZONE }),
  )
const relativeFormatter = () =>
  memo('rel', (l) => new Intl.RelativeTimeFormat(l, { numeric: 'auto' }))
const numberFormatter = () => memo('num', (l) => new Intl.NumberFormat(l))

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateTimeFormatter().format(date)
}

/** "3 menit lalu" untuk kolom yang butuh konteks cepat. */
export function formatRelative(value: string | null | undefined, now = Date.now()): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diffSeconds = Math.round((date.getTime() - now) / 1000)
  const abs = Math.abs(diffSeconds)
  if (abs < 60) return relativeFormatter().format(diffSeconds, 'second')
  if (abs < 3600) return relativeFormatter().format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86_400) return relativeFormatter().format(Math.round(diffSeconds / 3600), 'hour')
  return relativeFormatter().format(Math.round(diffSeconds / 86_400), 'day')
}

export function formatNumber(value: number): string {
  return numberFormatter().format(value)
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const TIME_ZONE = 'Asia/Jakarta'

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
})

const relativeFormatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })

const numberFormatter = new Intl.NumberFormat('id-ID')

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateTimeFormatter.format(date)
}

/** "3 menit lalu" untuk kolom yang butuh konteks cepat. */
export function formatRelative(value: string | null | undefined, now = Date.now()): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diffSeconds = Math.round((date.getTime() - now) / 1000)
  const abs = Math.abs(diffSeconds)
  if (abs < 60) return relativeFormatter.format(diffSeconds, 'second')
  if (abs < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86_400) return relativeFormatter.format(Math.round(diffSeconds / 3600), 'hour')
  return relativeFormatter.format(Math.round(diffSeconds / 86_400), 'day')
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

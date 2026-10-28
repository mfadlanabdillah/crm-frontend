export type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'closed'

export interface EventStreamOptions<T> {
  url: string
  /** Nama event SSE, contoh `case`; default `message`. */
  eventName?: string
  parse: (raw: string) => T
  onEvent: (event: T) => void
  onStatus?: (status: StreamStatus) => void
  onError?: (error: unknown) => void
  /** Injection point untuk test; default `new EventSource(url)`. */
  createSource?: (url: string) => EventSource
  baseDelayMs?: number
  maxDelayMs?: number
  /** Batas percobaan reconnect; tanpa nilai berarti terus mencoba. */
  maxAttempts?: number
}

/**
 * Exponential backoff dengan jitter 50–100% supaya semua agen tidak
 * reconnect serentak setelah deploy atau gangguan jaringan.
 */
export function backoffDelay(
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 30_000,
  random: () => number = Math.random,
): number {
  const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 1))
  return Math.round(ceiling * (0.5 + random() * 0.5))
}

/**
 * Satu koneksi SSE per sesi. EventSource asli melakukan reconnect sendiri,
 * tetapi tanpa backoff dan tanpa status yang bisa ditampilkan; kita tutup lalu
 * sambung ulang sendiri agar UI bisa jujur soal koneksi.
 */
export function createEventStream<T>(options: EventStreamOptions<T>): { close: () => void } {
  const {
    url,
    eventName = 'message',
    parse,
    onEvent,
    onStatus,
    onError,
    createSource = (target: string) => new EventSource(target, { withCredentials: true }),
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    maxAttempts,
  } = options

  let attempt = 0
  let closed = false
  let source: EventSource | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  const connect = () => {
    if (closed) return
    onStatus?.(attempt === 0 ? 'connecting' : 'reconnecting')

    const current = createSource(url)
    source = current

    current.onopen = () => {
      attempt = 0
      onStatus?.('live')
    }

    current.addEventListener(eventName, (event) => {
      const raw = (event as MessageEvent<string>).data
      try {
        onEvent(parse(raw))
      } catch (error) {
        onError?.(error)
      }
    })

    current.onerror = () => {
      current.close()
      source = null
      if (closed) return

      attempt += 1
      if (maxAttempts !== undefined && attempt > maxAttempts) {
        onStatus?.('offline')
        return
      }

      onStatus?.('reconnecting')
      timer = setTimeout(connect, backoffDelay(attempt, baseDelayMs, maxDelayMs))
    }
  }

  connect()

  return {
    close() {
      closed = true
      if (timer) clearTimeout(timer)
      source?.close()
      source = null
      onStatus?.('closed')
    },
  }
}

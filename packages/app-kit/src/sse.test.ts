import { describe, expect, it } from 'vitest'
import { backoffDelay } from './sse'

describe('backoffDelay', () => {
  it('naik eksponensial dari base delay', () => {
    expect(backoffDelay(1, 1000, 30_000, () => 1)).toBe(1000)
    expect(backoffDelay(2, 1000, 30_000, () => 1)).toBe(2000)
    expect(backoffDelay(3, 1000, 30_000, () => 1)).toBe(4000)
  })

  it('membatasi delay di maxDelayMs', () => {
    expect(backoffDelay(10, 1000, 30_000, () => 1)).toBe(30_000)
  })

  it('memberi jitter 50–100% agar klien tidak reconnect serentak', () => {
    expect(backoffDelay(3, 1000, 30_000, () => 0)).toBe(2000)
    expect(backoffDelay(3, 1000, 30_000, () => 0.5)).toBe(3000)
  })
})

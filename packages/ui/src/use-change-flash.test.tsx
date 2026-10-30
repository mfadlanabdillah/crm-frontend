import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChangeFlash } from './use-change-flash'

describe('useChangeFlash', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('stays off on the first render and when the value does not change', () => {
    const { result, rerender } = renderHook(({ value }) => useChangeFlash(value), {
      initialProps: { value: 'a' },
    })

    expect(result.current).toBe(false)
    rerender({ value: 'a' })
    expect(result.current).toBe(false)
  })

  it('turns on when the value changes, then off after the duration', () => {
    const { result, rerender } = renderHook(({ value }) => useChangeFlash(value, 1000), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    expect(result.current).toBe(true)

    act(() => void vi.advanceTimersByTime(999))
    expect(result.current).toBe(true)
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current).toBe(false)
  })

  it('restarts the timer when the value changes again during a flash', () => {
    const { result, rerender } = renderHook(({ value }) => useChangeFlash(value, 1000), {
      initialProps: { value: 1 },
    })

    rerender({ value: 2 })
    act(() => void vi.advanceTimersByTime(800))
    rerender({ value: 3 })
    act(() => void vi.advanceTimersByTime(800))
    expect(result.current).toBe(true)

    act(() => void vi.advanceTimersByTime(200))
    expect(result.current).toBe(false)
  })
})

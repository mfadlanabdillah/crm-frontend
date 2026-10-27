import { afterEach, describe, expect, it, vi } from 'vitest'
import { installGlobalErrorHandlers, reportError, setErrorReporter } from './telemetry'

describe('reportError', () => {
  afterEach(() => setErrorReporter(undefined))

  it('meneruskan error dan konteks ke reporter terpasang', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reporter = vi.fn()
    setErrorReporter(reporter)
    const error = new Error('boom')

    reportError(error, { source: 'test' })

    expect(reporter).toHaveBeenCalledWith(error, { source: 'test' })
  })

  it('tidak melempar bila reporter sendiri gagal', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setErrorReporter(() => {
      throw new Error('reporter rusak')
    })

    expect(() => reportError(new Error('x'))).not.toThrow()
  })
})

describe('installGlobalErrorHandlers', () => {
  afterEach(() => setErrorReporter(undefined))

  it('melaporkan promise yang ditolak dan berhenti setelah dilepas', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reporter = vi.fn()
    setErrorReporter(reporter)
    const uninstall = installGlobalErrorHandlers()
    const reason = new Error('tanpa catch')

    window.dispatchEvent(
      Object.assign(new Event('unhandledrejection'), { reason, promise: Promise.resolve() }),
    )
    expect(reporter).toHaveBeenCalledWith(reason, { source: 'unhandledrejection' })

    uninstall()
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'lagi' }))
    expect(reporter).toHaveBeenCalledTimes(1)
  })
})

import { screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@crm/api-client'
import { createI18n } from '@crm/i18n'
import { renderWithRouter } from '@crm/test-utils'
import { setErrorReporter } from '@/lib/telemetry'
import { RouteError, RouteNotFound } from './RouteFallbacks'

function renderThrowing(error: unknown) {
  function Thrower(): never {
    throw error
  }
  return renderWithRouter(<Thrower />, {
    rootOptions: { errorComponent: RouteError, notFoundComponent: RouteNotFound },
  })
}

describe('RouteError', () => {
  beforeAll(async () => {
    await createI18n()
  })

  it('menampilkan pesan umum dan melaporkan error tanpa membocorkan detailnya', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reporter = vi.fn()
    setErrorReporter(reporter)
    const error = new Error('stack rahasia internal')

    await renderThrowing(error)

    expect(await screen.findByRole('alert')).toHaveTextContent('Terjadi kesalahan')
    expect(screen.queryByText(/stack rahasia internal/)).not.toBeInTheDocument()
    expect(reporter).toHaveBeenCalledWith(error, { source: 'route' })
    setErrorReporter(undefined)
  })

  it('menampilkan kode referensi bila error API membawa requestId', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await renderThrowing(new ApiError('gagal', 500, 'internal', 'req-123'))

    expect(await screen.findByText('Kode referensi: req-123')).toBeInTheDocument()
  })
})

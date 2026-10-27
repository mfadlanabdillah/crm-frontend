import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@crm/api-client'
import { createI18n } from '@crm/i18n'
import { setErrorReporter } from '@/lib/telemetry'
import { RouteError, RouteNotFound } from './RouteFallbacks'

function renderThrowing(error: unknown) {
  const root = createRootRoute({ errorComponent: RouteError, notFoundComponent: RouteNotFound })
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => {
      throw error
    },
  })
  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
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

    renderThrowing(error)

    expect(await screen.findByRole('alert')).toHaveTextContent('Terjadi kesalahan')
    expect(screen.queryByText(/stack rahasia internal/)).not.toBeInTheDocument()
    expect(reporter).toHaveBeenCalledWith(error, { source: 'route' })
    setErrorReporter(undefined)
  })

  it('menampilkan kode referensi bila error API membawa requestId', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    renderThrowing(new ApiError('gagal', 500, 'internal', 'req-123'))

    expect(await screen.findByText('Kode referensi: req-123')).toBeInTheDocument()
  })
})

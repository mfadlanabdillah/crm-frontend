import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from '@crm/i18n'
import { ToastCard, Toaster } from './toast'
import { clearToasts, toast } from './toast-store'

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const show = (...args: Parameters<typeof toast>) => act(() => void toast(...args))

describe('Toaster', () => {
  beforeAll(async () => {
    await createI18n()
  })
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    act(() => clearToasts())
    vi.useRealTimers()
  })

  it('has a labelled region and announces a confirmation politely', () => {
    render(<Toaster />)
    show('Case diperbarui', { tone: 'success' })

    expect(screen.getByRole('region', { name: 'Notifikasi' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Case diperbarui')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('interrupts the reader for an error and keeps it until it is closed', () => {
    render(<Toaster />)
    show('Gagal menyimpan', { tone: 'danger' })
    advance(60_000)

    expect(screen.getByRole('alert')).toHaveTextContent('Gagal menyimpan')
  })

  it('dismisses a confirmation after five seconds, then removes it once it has left', () => {
    render(<Toaster />)
    show('Tersimpan', { tone: 'success' })

    advance(4999)
    expect(screen.getByRole('status')).not.toHaveAttribute('aria-hidden')

    advance(1)
    expect(screen.getByRole('status', { hidden: true })).toHaveAttribute('aria-hidden', 'true')

    advance(250)
    expect(screen.queryByText('Tersimpan')).not.toBeInTheDocument()
  })

  it('closes from the close button', () => {
    render(<Toaster />)
    show('Info', { tone: 'info' })

    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }))
    advance(250)

    expect(screen.queryByText('Info')).not.toBeInTheDocument()
  })

  it('does not dismiss a toast while it is hovered, and restarts the timer afterwards', () => {
    render(<Toaster />)
    show('Dibaca', { tone: 'success' })
    const card = screen.getByRole('status')

    fireEvent.mouseEnter(card)
    advance(20_000)
    expect(screen.getByText('Dibaca')).toBeInTheDocument()
    expect(card).not.toHaveAttribute('aria-hidden')

    fireEvent.mouseLeave(card)
    advance(5000 + 250)
    expect(screen.queryByText('Dibaca')).not.toBeInTheDocument()
  })

  it('keeps focus from losing a toast the same way', () => {
    render(<Toaster />)
    show('Fokus', { tone: 'success' })
    const close = screen.getByRole('button', { name: 'Tutup' })

    fireEvent.focus(close)
    advance(20_000)
    expect(screen.getByText('Fokus')).toBeInTheDocument()

    fireEvent.blur(close)
    advance(5000 + 250)
    expect(screen.queryByText('Fokus')).not.toBeInTheDocument()
  })

  it('shows only the five newest toasts', () => {
    render(<Toaster />)
    for (let i = 1; i <= 7; i++) show(`Pesan ${i}`, { tone: 'info', duration: null })

    expect(screen.getAllByRole('status').map((node) => node.textContent)).toEqual([
      'Pesan 3',
      'Pesan 4',
      'Pesan 5',
      'Pesan 6',
      'Pesan 7',
    ])
  })
})

describe('ToastCard', () => {
  it('hides a card that is leaving from assistive technology and the tab order', () => {
    render(<ToastCard message="Keluar" closeLabel="Tutup" closing onClose={() => {}} />)

    expect(screen.getByRole('status', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Tutup', hidden: true })).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })
})

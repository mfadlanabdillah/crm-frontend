import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createI18n } from '@crm/i18n'
import { EmptyState, ErrorState } from './data-state'

beforeAll(async () => {
  await createI18n()
})

describe('ErrorState', () => {
  it('tampil sebagai alert dengan teks bawaan dan memanggil onRetry', async () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Gagal memuat data')
    await userEvent.click(screen.getByRole('button', { name: /coba lagi/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('memakai judul dan deskripsi kustom bila diberikan', () => {
    render(<ErrorState title="Judul X" description="Detail Y" onRetry={() => {}} />)
    expect(screen.getByText('Judul X')).toBeInTheDocument()
    expect(screen.getByText('Detail Y')).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('menampilkan judul, deskripsi, dan aksi', () => {
    render(<EmptyState title="Kosong" description="Belum ada" action={<button>Tambah</button>} />)
    expect(screen.getByText('Kosong')).toBeInTheDocument()
    expect(screen.getByText('Belum ada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tambah' })).toBeInTheDocument()
  })
})

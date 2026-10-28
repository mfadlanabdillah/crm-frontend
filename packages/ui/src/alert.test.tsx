import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from './alert'

describe('Alert', () => {
  it('interrupts the reader for errors', () => {
    render(<Alert>Gagal menyimpan</Alert>)

    expect(screen.getByRole('alert')).toHaveTextContent('Gagal menyimpan')
  })

  it('announces other tones politely', () => {
    render(<Alert tone="success">Tersimpan</Alert>)

    expect(screen.getByRole('status')).toHaveClass('text-success-ink')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

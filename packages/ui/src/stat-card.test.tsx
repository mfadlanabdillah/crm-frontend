import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard } from './stat-card'

describe('StatCard', () => {
  it('menampilkan label dan nilainya', () => {
    render(<StatCard label="Case terbuka" value={12} />)

    expect(screen.getByText('Case terbuka')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('menerima node sebagai nilai, misalnya tautan drill-down', () => {
    render(<StatCard label="Antrean" value={<a href="/cases?queue=l2">6</a>} />)

    expect(screen.getByRole('link', { name: '6' })).toHaveAttribute('href', '/cases?queue=l2')
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Inline, Stack } from './layout'
import { SectionHeading } from './section-heading'
import { StatCard } from './stat-card'

describe('layout', () => {
  it('Stack puts children in a column with the chosen gap', () => {
    render(<Stack gap="lg" data-testid="stack" />)

    expect(screen.getByTestId('stack')).toHaveClass('flex-col', 'gap-4')
  })

  it('Inline wraps, centers by default, and can push children apart', () => {
    render(<Inline justify="between" data-testid="row" />)

    expect(screen.getByTestId('row')).toHaveClass('flex-wrap', 'items-center', 'justify-between')
  })
})

describe('StatCard', () => {
  it('shows the figure with its name, and the value can be a link', () => {
    render(<StatCard label="Belum di-assign" value={<a href="/cases">2.760</a>} />)

    expect(screen.getByText('Belum di-assign')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '2.760' })).toHaveAttribute('href', '/cases')
  })
})

describe('SectionHeading', () => {
  it('is an h3 unless told otherwise, and keeps one look for every level', () => {
    render(
      <>
        <SectionHeading>Timeline</SectionHeading>
        <SectionHeading as="h4">Detail</SectionHeading>
      </>,
    )

    expect(screen.getByRole('heading', { level: 3, name: 'Timeline' })).toHaveClass('text-sm')
    expect(screen.getByRole('heading', { level: 4, name: 'Detail' })).toHaveClass('text-sm')
  })
})

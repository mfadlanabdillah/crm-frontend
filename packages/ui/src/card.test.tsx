import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './card'

describe('Card', () => {
  it('renders the requested element with padding by default', () => {
    render(
      <Card as="section" aria-label="panel">
        content
      </Card>,
    )

    const card = screen.getByRole('region', { name: 'panel' })
    expect(card.tagName).toBe('SECTION')
    expect(card).toHaveClass('rounded-xl', 'border', 'p-4')
  })

  it('drops the padding and merges extra classes', () => {
    render(<Card padded={false} className="mt-4" data-testid="card" />)

    expect(screen.getByTestId('card')).not.toHaveClass('p-4')
    expect(screen.getByTestId('card')).toHaveClass('mt-4')
  })
})

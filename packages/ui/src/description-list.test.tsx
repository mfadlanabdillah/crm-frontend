import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DescriptionItem, DescriptionList } from './description-list'

describe('DescriptionList', () => {
  it('pairs each label with its value', () => {
    render(
      <DescriptionList>
        <DescriptionItem label="Telepon">0812</DescriptionItem>
      </DescriptionList>,
    )

    expect(screen.getByText('Telepon').tagName).toBe('DT')
    expect(screen.getByText('0812').tagName).toBe('DD')
  })

  it('offers a two-column grid layout', () => {
    const { container } = render(<DescriptionList layout="grid" />)

    expect(container.querySelector('dl')).toHaveClass('grid', 'sm:grid-cols-2')
  })
})

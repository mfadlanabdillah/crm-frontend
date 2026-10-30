import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tooltip } from './tooltip'

describe('Tooltip', () => {
  it('repeats the trigger name visually and hides the repeat from assistive technology', () => {
    render(
      <Tooltip label="Case">
        <a href="/cases" aria-label="Case">
          icon
        </a>
      </Tooltip>,
    )

    expect(screen.getAllByText('Case')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Case' })).toBeInTheDocument()
    expect(screen.getByText('Case', { selector: '[aria-hidden="true"]' })).toHaveClass(
      'opacity-0',
      'group-hover/tooltip:opacity-100',
      'group-focus-within/tooltip:opacity-100',
    )
  })

  it('renders only the trigger when disabled', () => {
    render(
      <Tooltip label="Case" disabled>
        <button type="button">Case</button>
      </Tooltip>,
    )

    expect(screen.getAllByText('Case')).toHaveLength(1)
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from './segmented-control'

const options = [
  { value: 'customer', label: 'Customer' },
  { value: 'internal', label: 'Tim internal' },
] as const

describe('SegmentedControl', () => {
  it('marks the chosen option as pressed and reports a change', async () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        value="customer"
        options={options}
        onChange={onChange}
        aria-label="Visibilitas"
      />,
    )

    expect(screen.getByRole('group', { name: 'Visibilitas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Customer' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tim internal' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Tim internal' }))
    expect(onChange).toHaveBeenCalledWith('internal')
  })
})

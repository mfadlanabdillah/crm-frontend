import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Drawer } from './drawer'

describe('Drawer', () => {
  it('opens as a named modal dialog', () => {
    render(
      <Drawer title="Case" closeLabel="Close" onClose={vi.fn()}>
        body
      </Drawer>,
    )

    expect(screen.getByRole('dialog', { name: 'Case' })).toHaveAttribute('open')
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('calls onClose from the close button, and not from a click inside the panel', () => {
    const onClose = vi.fn()
    render(
      <Drawer title="Case" closeLabel="Close" onClose={onClose}>
        body
      </Drawer>,
    )

    fireEvent.click(screen.getByText('body'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on a click on the backdrop', () => {
    const onClose = vi.fn()
    render(
      <Drawer title="Case" closeLabel="Close" onClose={onClose}>
        body
      </Drawer>,
    )

    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

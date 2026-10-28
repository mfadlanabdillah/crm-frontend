import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TextLink } from './link'

describe('TextLink', () => {
  it('navigates in place on a plain click and keeps a real href', async () => {
    const onNavigate = vi.fn()
    render(
      <TextLink href="/cases/1" onNavigate={onNavigate}>
        Buka
      </TextLink>,
    )

    const link = screen.getByRole('link', { name: 'Buka' })
    expect(link).toHaveAttribute('href', '/cases/1')
    await userEvent.click(link)

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('leaves modified clicks to the browser (new tab)', async () => {
    const onNavigate = vi.fn()
    render(
      <TextLink href="/cases/1" onNavigate={onNavigate}>
        Buka
      </TextLink>,
    )

    // One instance, so the held Control key is still down for the click.
    const user = userEvent.setup()
    await user.keyboard('{Control>}')
    await user.click(screen.getByRole('link', { name: 'Buka' }))

    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('underlines a link inside running text', () => {
    render(
      <TextLink href="/x" inline>
        teks
      </TextLink>,
    )

    expect(screen.getByRole('link')).toHaveClass('underline')
  })
})

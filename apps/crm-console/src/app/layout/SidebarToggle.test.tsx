import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createI18n } from '@crm/i18n'
import { SidebarToggle } from './SidebarToggle'

describe('SidebarToggle', () => {
  beforeAll(async () => {
    await createI18n()
  })

  it('offers to collapse an expanded sidebar and says which element it controls', async () => {
    const onToggle = vi.fn()
    render(<SidebarToggle collapsed={false} onToggle={onToggle} controls="app-sidebar" />)

    const button = screen.getByRole('button', { name: 'Ciutkan sidebar' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-controls', 'app-sidebar')

    await userEvent.click(button)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('offers to expand a collapsed sidebar', () => {
    render(<SidebarToggle collapsed onToggle={() => {}} controls="app-sidebar" />)

    expect(screen.getByRole('button', { name: 'Perluas sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

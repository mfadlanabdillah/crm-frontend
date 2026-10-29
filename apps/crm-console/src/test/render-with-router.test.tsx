import { Link } from '@tanstack/react-router'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@crm/test-utils'

describe('renderWithRouter', () => {
  it('resolves a Link to a registered target', async () => {
    await renderWithRouter(
      <Link to="/remote/$moduleId" params={{ moduleId: 'finance' }}>
        Open module
      </Link>,
      { linkTargets: ['/remote/$moduleId'] },
    )

    expect(screen.getByRole('link', { name: 'Open module' })).toHaveAttribute(
      'href',
      '/remote/finance',
    )
  })
})

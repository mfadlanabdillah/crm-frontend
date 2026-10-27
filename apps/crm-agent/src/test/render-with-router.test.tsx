import { Link } from '@tanstack/react-router'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@crm/test-utils'

describe('renderWithRouter', () => {
  it('resolves a Link to a registered target', async () => {
    await renderWithRouter(
      <Link to="/cases/$caseId" params={{ caseId: 'case-1' }}>
        Open case
      </Link>,
      { linkTargets: ['/cases/$caseId'] },
    )

    expect(screen.getByRole('link', { name: 'Open case' })).toHaveAttribute('href', '/cases/case-1')
  })
})

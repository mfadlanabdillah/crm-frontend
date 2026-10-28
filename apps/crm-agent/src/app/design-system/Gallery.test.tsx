import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { createI18n } from '@crm/i18n'
import { Gallery } from './Gallery'

describe('Gallery', () => {
  beforeAll(async () => {
    await createI18n()
  })

  it('shows every shared component without crashing', () => {
    render(<Gallery />)

    expect(screen.getByRole('heading', { name: 'Design system' })).toBeInTheDocument()
    for (const section of [
      'Button',
      'Badge',
      'Form controls',
      'Alert',
      'Loading, empty, and error',
    ]) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument()
    }
  })
})

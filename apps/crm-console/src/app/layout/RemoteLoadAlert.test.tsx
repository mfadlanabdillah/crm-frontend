import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createI18n } from '@crm/i18n'
import { RemoteLoadAlert } from './RemoteLoadAlert'

describe('RemoteLoadAlert', () => {
  beforeAll(async () => {
    await createI18n()
  })

  it('renders nothing when every remote loaded', () => {
    const { container } = render(<RemoteLoadAlert names={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('names the failed remotes and reloads the page on retry', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    render(<RemoteLoadAlert names={['crm_cs']} />)

    expect(screen.getByRole('alert')).toHaveTextContent('crm_cs')
    await userEvent.click(screen.getByRole('button', { name: 'Muat ulang' }))

    expect(reload).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { createI18n } from '@crm/i18n'
import { registerRemoteModule } from '@/app/modules/registry'
import type { ModuleDefinition } from '@/modules/types'
import { RemoteModulePage } from './RemoteModulePage'

describe('RemoteModulePage', () => {
  beforeAll(async () => {
    await createI18n()
  })

  it('renders the page of a registered remote module', () => {
    registerRemoteModule({
      id: 'zz-page',
      labelKey: 'zz.title',
      basePath: '/remote/zz-page',
      Page: () => <p>remote page body</p>,
    } as unknown as ModuleDefinition)

    render(<RemoteModulePage moduleId="zz-page" />)

    expect(screen.getByText('remote page body')).toBeInTheDocument()
  })

  it('says the module is unavailable when it is not registered', () => {
    render(<RemoteModulePage moduleId="zz-missing" />)

    expect(screen.getByText('Modul tidak tersedia')).toBeInTheDocument()
  })
})

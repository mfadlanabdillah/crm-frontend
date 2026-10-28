import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'
import { createI18n } from '@crm/i18n'
import type { RemotePageProps } from '@crm/module-contract'
import { renderWithRouter } from '@crm/test-utils'
import { registerRemoteModule } from '@/app/modules/registry'
import type { ModuleDefinition } from '@/modules/types'
import { RemoteModulePage } from './RemoteModulePage'

function ProbePage({ api, subPath, navigate, openHostPath }: RemotePageProps) {
  return (
    <div>
      <p>sub:{subPath}</p>
      <p>api:{typeof api.listCases}</p>
      <button type="button" onClick={() => navigate('case/1')}>
        open
      </button>
      <button type="button" onClick={() => navigate('')}>
        root
      </button>
      <button type="button" onClick={() => openHostPath('/cases?queue=l1')}>
        host
      </button>
      <button type="button" onClick={() => openHostPath('//evil.example')}>
        evil
      </button>
    </div>
  )
}

describe('RemoteModulePage', () => {
  beforeAll(async () => {
    await createI18n()
    registerRemoteModule({
      id: 'zz-page',
      labelKey: 'zz.title',
      basePath: '/remote/zz-page',
      Page: ProbePage,
    } as unknown as ModuleDefinition)
  })

  it('gives the remote page the host API client and the path below its base', async () => {
    await renderWithRouter(<RemoteModulePage moduleId="zz-page" subPath="case/9" />)

    expect(screen.getByText('sub:case/9')).toBeInTheDocument()
    expect(screen.getByText('api:function')).toBeInTheDocument()
  })

  it('navigates to a sub path inside the host router when the remote asks to', async () => {
    const { router } = await renderWithRouter(<RemoteModulePage moduleId="zz-page" subPath="" />)

    await userEvent.click(screen.getByRole('button', { name: 'open' }))

    expect(router.state.location.pathname).toBe('/remote/zz-page/case/1')
  })

  it('navigates to the module root with an empty sub path', async () => {
    const { router } = await renderWithRouter(
      <RemoteModulePage moduleId="zz-page" subPath="case/1" />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'root' }))

    expect(router.state.location.pathname).toBe('/remote/zz-page')
  })

  it('opens internal host paths and ignores anything else', async () => {
    const { router } = await renderWithRouter(<RemoteModulePage moduleId="zz-page" subPath="" />)

    await userEvent.click(screen.getByRole('button', { name: 'evil' }))
    expect(router.state.location.pathname).toBe('/')

    await userEvent.click(screen.getByRole('button', { name: 'host' }))
    expect(router.state.location.pathname).toBe('/cases')
  })

  it('says the module is unavailable when it is not registered', async () => {
    await renderWithRouter(<RemoteModulePage moduleId="zz-missing" subPath="" />)

    expect(screen.getByText('Modul tidak tersedia')).toBeInTheDocument()
  })
})

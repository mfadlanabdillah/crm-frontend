import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadRemote, registerRemotes } from '@module-federation/runtime'
import { allModules } from '@/app/modules/registry'
import { loadRemoteModules, parseRemotes } from './remote'

vi.mock('@module-federation/runtime', () => ({
  loadRemote: vi.fn(),
  registerRemotes: vi.fn(),
}))

const fixtureModule = { id: 'zz-remote', labelKey: 'zz.title', basePath: '/remote/zz-remote' }

describe('parseRemotes', () => {
  it('reads name=entry pairs and keeps "=" inside the entry URL', () => {
    expect(parseRemotes('a=http://x/remoteEntry.js, b=http://y/e.js?v=2')).toEqual([
      { name: 'a', entry: 'http://x/remoteEntry.js' },
      { name: 'b', entry: 'http://y/e.js?v=2' },
    ])
  })

  it.each([undefined, '', ' , ', 'noequals', '=http://x', 'a='])('ignores %j', (raw) => {
    expect(parseRemotes(raw)).toEqual([])
  })
})

describe('loadRemoteModules', () => {
  beforeEach(() => {
    vi.mocked(loadRemote).mockReset()
    vi.mocked(registerRemotes).mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it('does nothing when no remote is configured', async () => {
    await loadRemoteModules(undefined)

    expect(registerRemotes).not.toHaveBeenCalled()
    expect(loadRemote).not.toHaveBeenCalled()
  })

  it('registers the remote and adds its module to the registry', async () => {
    vi.mocked(loadRemote).mockResolvedValue({ default: fixtureModule })

    await loadRemoteModules('zz_remote=http://localhost:1/remoteEntry.js')

    expect(registerRemotes).toHaveBeenCalledWith([
      { name: 'zz_remote', entry: 'http://localhost:1/remoteEntry.js', type: 'module' },
    ])
    expect(loadRemote).toHaveBeenCalledWith('zz_remote/module')
    expect(allModules().some((module) => module.id === 'zz-remote')).toBe(true)
  })

  it('logs and continues when a remote cannot be loaded', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(loadRemote).mockRejectedValue(new Error('network down'))

    await expect(loadRemoteModules('zz_down=http://localhost:1/e.js')).resolves.toBeUndefined()

    expect(error).toHaveBeenCalledWith(expect.stringContaining('zz_down'), expect.any(Error))
  })

  it('gives up on a remote that never answers', async () => {
    vi.useFakeTimers()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(loadRemote).mockReturnValue(new Promise(() => {}))

    const loading = loadRemoteModules('zz_slow=http://localhost:1/e.js')
    await vi.advanceTimersByTimeAsync(5_001)
    await loading

    expect(error).toHaveBeenCalled()
    vi.useRealTimers()
  })
})

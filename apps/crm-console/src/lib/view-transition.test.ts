import { afterEach, describe, expect, it, vi } from 'vitest'
import { routeViewTransition } from './view-transition'

function stubBrowser({ reduced, typed }: { reduced: boolean; typed: boolean }) {
  vi.stubGlobal('matchMedia', () => ({ matches: reduced }))
  vi.stubGlobal('CSS', { supports: () => typed })
}

describe('routeViewTransition', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is off when the agent prefers reduced motion', () => {
    stubBrowser({ reduced: true, typed: true })

    expect(routeViewTransition()).toBe(false)
  })

  it('is off where a transition cannot be skipped per navigation', () => {
    stubBrowser({ reduced: false, typed: false })

    expect(routeViewTransition()).toBe(false)
  })

  it('is off when the browser cannot tell', () => {
    vi.stubGlobal('matchMedia', undefined)
    vi.stubGlobal('CSS', undefined)

    expect(routeViewTransition()).toBe(false)
  })

  it('runs for a change of page and is skipped when only the search changes', () => {
    stubBrowser({ reduced: false, typed: true })
    const options = routeViewTransition()

    if (typeof options !== 'object') throw new Error('expected view transition options')
    const types = options.types as (info: { pathChanged: boolean }) => string[] | false
    expect(types({ pathChanged: true })).toEqual(['route'])
    expect(types({ pathChanged: false })).toBe(false)
  })
})

import { setupServer } from 'msw/node'
import type { RequestHandler } from 'msw'

/**
 * Server MSW untuk test Node. Pemakaian:
 *
 *   const server = createMockServer(handlers)
 *   beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
 *   afterEach(() => server.resetHandlers())
 *   afterAll(() => server.close())
 */
export function createMockServer(handlers: RequestHandler[] = []) {
  return setupServer(...handlers)
}

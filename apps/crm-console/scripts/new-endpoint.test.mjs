import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const repoRoot = path.join(appRoot, '../..')
let root

const TOUCHED = [
  'packages/api-client/openapi/openapi.yaml',
  'packages/api-client/src/index.ts',
  'apps/crm-console/src/modules/customer/api/customer.ts',
  'apps/crm-console/src/mocks/handlers.ts',
  'docs/contract-status.md',
]

function copyFromRepo(rel) {
  mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
  cpSync(path.join(repoRoot, rel), path.join(root, rel))
}

/** Minimal copy of the repo: the script derives its paths from its own location, so the real repo stays untouched. */
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'new-endpoint-'))
  copyFromRepo('apps/crm-console/scripts/new-endpoint.mjs')
  for (const rel of [...TOUCHED, 'apps/crm-console/src/modules/customer/queries/keys.ts']) {
    copyFromRepo(rel)
  }
  // A module fresh from `new:module`: empty facade, keys file only.
  const zz = path.join(root, 'apps/crm-console/src/modules/zz')
  mkdirSync(path.join(zz, 'api'), { recursive: true })
  mkdirSync(path.join(zz, 'queries'), { recursive: true })
  writeFileSync(path.join(zz, 'api/zz.ts'), '/** Facade. */\nexport const zzApi = {}\n')
  writeFileSync(
    path.join(zz, 'queries/keys.ts'),
    "export const zzKeys = { all: ['zz'] as const }\n",
  )
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

function run(...args) {
  try {
    execFileSync('node', [path.join(root, 'apps/crm-console/scripts/new-endpoint.mjs'), ...args], {
      env: { ...process.env, NEW_ENDPOINT_SKIP_POSTPROCESS: '1' },
      stdio: 'pipe',
    })
    return { ok: true, stderr: '' }
  } catch (error) {
    return { ok: false, stderr: String(error.stderr) }
  }
}

const read = (rel) => readFileSync(path.join(root, rel), 'utf8')
const snapshot = () => TOUCHED.map(read)

describe('new:endpoint', () => {
  it('wires a GET with a path parameter through all six places', () => {
    expect(run('zz', 'getZzItem', '--path', '/v1/zz-items/{zzItemId}').ok).toBe(true)

    const yaml = read('packages/api-client/openapi/openapi.yaml')
    expect(yaml).toContain('  /v1/zz-items/{zzItemId}:\n    get:\n      tags: [zz]')
    expect(yaml).toContain("$ref: '#/components/schemas/ZzItemResponse'")
    expect(yaml).toContain("'404':")
    expect(yaml.endsWith('      additionalProperties: true\n')).toBe(true)

    const client = read('packages/api-client/src/index.ts')
    expect(client).toContain("export type ZzItemResponse = components['schemas']['ZzItemResponse']")
    expect(client).toContain(
      'getZzItem(zzItemId: string, signal?: AbortSignal): Promise<ZzItemResponse>',
    )
    expect(client).toContain("client.GET('/v1/zz-items/{zzItemId}'")

    const facade = read('apps/crm-console/src/modules/zz/api/zz.ts')
    expect(facade).toContain("import { api } from '@/lib/api'")
    expect(facade).toContain('zzItem: (zzItemId: string, signal?: AbortSignal) =>')

    const hook = read('apps/crm-console/src/modules/zz/queries/useZzItem.ts')
    expect(hook).toContain('export function useZzItem(zzItemId: string)')
    expect(hook).toContain("queryKey: [...zzKeys.all, 'zzItem', zzItemId]")

    const handlers = read('apps/crm-console/src/mocks/handlers.ts')
    expect(handlers).toContain("http.get('/v1/zz-items/:zzItemId'")
    expect(handlers).toContain("jsonError(501, 'not_implemented'")
    expect(handlers.endsWith('  }),\n]\n')).toBe(true)

    expect(read('docs/contract-status.md')).toContain(
      '| `GET /v1/zz-items/{zzItemId}` | `modules/zz/queries/useZzItem.ts` | Proposed |',
    )
  })

  it('appends to a filled facade and gates the mock with --permission', () => {
    expect(
      run(
        'customer',
        'getZzCustomerFixture',
        '--path',
        '/v1/customers/{customerId}/zz-fixtures',
        '--permission',
        'customer.view',
      ).ok,
    ).toBe(true)

    const facade = read('apps/crm-console/src/modules/customer/api/customer.ts')
    expect(facade).toContain('zzCustomerFixture: (customerId: string, signal?: AbortSignal) =>')
    expect(facade).toContain('detail: (customerId')
    expect(facade.trimEnd().endsWith('\n}')).toBe(true)
    expect(read('apps/crm-console/src/mocks/handlers.ts')).toContain(
      "can(session.user.role, 'customer.view')",
    )
    expect(read('packages/api-client/openapi/openapi.yaml')).toContain("'403':")
  })

  it('supports a path without parameters', () => {
    expect(run('zz', 'getZzStats', '--path', '/v1/zz-stats').ok).toBe(true)

    expect(read('packages/api-client/src/index.ts')).toContain(
      "client.GET('/v1/zz-stats', signal ? { signal } : {})",
    )
    expect(read('apps/crm-console/src/modules/zz/queries/useZzStats.ts')).toContain(
      'export function useZzStats()',
    )
  })

  it('refuses duplicates and bad arguments without touching a file', () => {
    const before = snapshot()

    expect(run('customer', 'getCustomer', '--path', '/v1/customers/{customerId}').stderr).toContain(
      'already exists',
    )
    expect(run('zz', 'getZzItem', '--path', '/v1/customers/{customerId}').stderr).toContain(
      'already exists',
    )
    expect(run('zz', 'GetZzItem', '--path', '/v1/zz').stderr).toContain('camelCase')
    expect(run('zz', 'getZzItem', '--path', '/zz').stderr).toContain('--path')
    expect(run('zz', 'getZzItem').stderr).toContain('usage')
    expect(run('missing', 'getThing', '--path', '/v1/things').ok).toBe(false)

    expect(snapshot()).toEqual(before)
    expect(existsSync(path.join(root, 'apps/crm-console/src/modules/zz/queries/useZzItem.ts'))).toBe(
      false,
    )
  })

  it('writes nothing when one anchor is not recognized', () => {
    writeFileSync(path.join(root, 'apps/crm-console/src/mocks/handlers.ts'), 'export {}\n')
    const before = snapshot()

    const result = run('zz', 'getZzItem', '--path', '/v1/zz-items/{zzItemId}')

    expect(result.ok).toBe(false)
    expect(result.stderr).toContain('handlers.ts format not recognized')
    expect(snapshot()).toEqual(before)
    expect(existsSync(path.join(root, 'apps/crm-console/src/modules/zz/queries/useZzItem.ts'))).toBe(
      false,
    )
  })
})

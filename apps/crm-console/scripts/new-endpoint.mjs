/**
 * Adds a GET endpoint to a module in one pass.
 *
 *   pnpm new:endpoint <module> <operationId> --path /v1/<segments>[/{param}] [--permission <module.action>]
 *   example: pnpm new:endpoint customer getCustomerNotes --path /v1/customers/{customerId}/notes
 *
 * Touches, in this order (all anchors are checked before any file is written):
 *   packages/api-client/openapi/openapi.yaml   path with a placeholder response schema
 *   packages/api-client/src/index.ts           type export + client method
 *   src/modules/<module>/api/<module>.ts       facade entry
 *   src/modules/<module>/queries/use<Name>.ts  query options + hook (new file)
 *   src/mocks/handlers.ts                      stub handler answering 501
 *   docs/contract-status.md                    row with status Proposed
 * Then runs `pnpm codegen:api` and prettier. Only GET with path parameters; the response schema,
 * the mock body, and PII masking are yours to fill in.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const repoRoot = path.join(appRoot, '../..')
const src = path.join(appRoot, 'src')

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const positional = args.filter((arg, i) => !arg.startsWith('--') && !args[i - 1]?.startsWith('--'))
const [id, operationId] = positional
const urlPath = flag('--path')
const permission = flag('--permission')

function fail(message) {
  console.error(`new:endpoint: ${message}`)
  process.exit(1)
}

if (!id || !operationId || !urlPath) {
  fail('usage: pnpm new:endpoint <module> <operationId> --path /v1/<segments>[/{param}]')
}
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) fail('module must be lowercase kebab-case')
if (!/^[a-z][A-Za-z0-9]*$/.test(operationId)) fail('operationId must be camelCase, e.g. getInvoice')
if (!/^\/v1(\/([a-z0-9-]+|\{[a-zA-Z][A-Za-z0-9]*\}))+$/.test(urlPath)) {
  fail('--path must look like /v1/invoices/{invoiceId}')
}
if (permission && !/^[a-z]+(\.[a-z]+)+$/.test(permission)) {
  fail('--permission must look like "module.action", e.g. customer.view')
}

const upperFirst = (s) => s[0].toUpperCase() + s.slice(1)
const lowerFirst = (s) => s[0].toLowerCase() + s.slice(1)
const modulePascal = id.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
const moduleCamel = lowerFirst(modulePascal)
// getInvoice -> Invoice; any other name keeps its full shape.
const thing = upperFirst(operationId.replace(/^get(?=[A-Z])/, ''))
const thingCamel = lowerFirst(thing)
const schemaName = `${thing}Response`
const params = [...urlPath.matchAll(/\{(\w+)\}/g)].map((m) => m[1])
const mswPath = urlPath.replace(/\{(\w+)\}/g, ':$1')
const argList = params.map((p) => `${p}: string`)
const callArgs = params.join(', ')
const withSignal = (list) => [...list, 'signal?: AbortSignal'].join(', ')

const files = {
  yaml: path.join(repoRoot, 'packages/api-client/openapi/openapi.yaml'),
  client: path.join(repoRoot, 'packages/api-client/src/index.ts'),
  facade: path.join(src, 'modules', id, 'api', `${id}.ts`),
  keys: path.join(src, 'modules', id, 'queries', 'keys.ts'),
  hook: path.join(src, 'modules', id, 'queries', `use${thing}.ts`),
  handlers: path.join(src, 'mocks/handlers.ts'),
  status: path.join(repoRoot, 'docs/contract-status.md'),
}

for (const key of ['yaml', 'client', 'facade', 'keys', 'handlers', 'status']) {
  if (!existsSync(files[key])) fail(`${path.relative(repoRoot, files[key])} not found`)
}
if (existsSync(files.hook)) fail(`${path.relative(repoRoot, files.hook)} already exists`)

const read = (file) => readFileSync(files[file], 'utf8')

// openapi.yaml: the path goes before `components:`, the placeholder schema at the end (schemas is last).
let yaml = read('yaml')
if (yaml.includes(`\n  ${urlPath}:`)) fail(`${urlPath} already exists in openapi.yaml`)
if (yaml.includes(`operationId: ${operationId}\n`))
  fail(`operationId ${operationId} already exists`)
if (yaml.includes(`\n    ${schemaName}:`)) fail(`schema ${schemaName} already exists`)
const schemasAt = yaml.indexOf('\n  schemas:\n')
const componentsAt = yaml.indexOf('\ncomponents:\n')
if (schemasAt === -1 || componentsAt === -1 || /\n[A-Za-z]/.test(yaml.slice(schemasAt + 1))) {
  fail('openapi.yaml format not recognized (expected `schemas:` as the last section)')
}
const parameterLines = params
  .map(
    (p) =>
      `        - name: ${p}\n          in: path\n          required: true\n          schema:\n            type: string\n`,
  )
  .join('')
const pathBlock = `  ${urlPath}:
    get:
      tags: [${id}]
      operationId: ${operationId}
      summary: TODO describe ${operationId}
${params.length ? `      parameters:\n${parameterLines}` : ''}      responses:
        '200':
          description: TODO describe the response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${schemaName}'
        '401':
          $ref: '#/components/responses/Unauthorized'
${permission ? `        '403':\n          $ref: '#/components/responses/Forbidden'\n` : ''}${params.length ? `        '404':\n          $ref: '#/components/responses/NotFound'\n` : ''}
`
yaml = yaml.replace('\ncomponents:\n', `\n${pathBlock}components:\n`)
yaml = `${yaml.trimEnd()}\n    ${schemaName}:\n      type: object\n      description: Placeholder; replace with the real shape\n      additionalProperties: true\n`

// api-client: type export before ApiClientOptions, method at the end of the returned object.
let client = read('client')
const optionsAnchor = 'export interface ApiClientOptions'
const methodsAnchor = '\n  }\n}\n\nexport type ApiClient'
if (!client.includes(optionsAnchor) || !client.includes(methodsAnchor)) {
  fail('packages/api-client/src/index.ts format not recognized; add the method by hand')
}
if (client.includes(`\n    ${operationId}(`)) fail(`client method ${operationId} already exists`)
const clientCall = params.length
  ? `unwrap(
        client.GET('${urlPath}', {
          params: { path: { ${callArgs} } },
          ...(signal ? { signal } : {}),
        }),
      )`
  : `unwrap(client.GET('${urlPath}', signal ? { signal } : {}))`
const clientMethod = `    ${operationId}(${withSignal(argList)}): Promise<${schemaName}> {
      return ${clientCall}
    },`
client = client
  .replace(
    optionsAnchor,
    `export type ${schemaName} = components['schemas']['${schemaName}']\n\n${optionsAnchor}`,
  )
  .replace(methodsAnchor, `\n\n${clientMethod}${methodsAnchor}`)

// facade: one entry; an empty `{}` facade (fresh from new:module) and a filled one are both handled.
let facade = read('facade')
const facadeKey = thingCamel
if (facade.includes(`\n  ${facadeKey}:`)) fail(`facade entry ${facadeKey} already exists`)
const facadeEntry = `  ${facadeKey}: (${withSignal(argList)}) => api.${operationId}(${[...params, 'signal'].join(', ')}),`
if (/=\s*\{\}\s*$/.test(facade)) {
  facade = facade.replace(/=\s*\{\}\s*$/, `= {\n${facadeEntry}\n}\n`)
} else if (facade.trimEnd().endsWith('\n}')) {
  facade = `${facade.trimEnd().slice(0, -1)}${facadeEntry}\n}\n`
} else {
  fail(`modules/${id}/api/${id}.ts format not recognized; add the entry by hand`)
}
if (!facade.includes("from '@/lib/api'")) facade = `import { api } from '@/lib/api'\n\n${facade}`

const hook = `import { queryOptions, useQuery } from '@tanstack/react-query'
import { ${moduleCamel}Api } from '@/modules/${id}/api/${id}'
import { ${moduleCamel}Keys } from '@/modules/${id}/queries/keys'

export function ${thingCamel}QueryOptions(${argList.join(', ')}) {
  return queryOptions({
    queryKey: [...${moduleCamel}Keys.all, '${thingCamel}'${params.map((p) => `, ${p}`).join('')}],
    queryFn: ({ signal }) => ${moduleCamel}Api.${facadeKey}(${[...params, 'signal'].join(', ')}),
  })
}

export function use${thing}(${argList.join(', ')}) {
  return useQuery(${thingCamel}QueryOptions(${callArgs}))
}
`

let handlers = read('handlers')
if (!handlers.endsWith('  }),\n]\n'))
  fail('mocks/handlers.ts format not recognized; add the handler by hand')
const permissionCheck = permission
  ? `    if (!can(session.user.role, '${permission}')) {
      return jsonError(403, 'forbidden', 'Role is not allowed')
    }
`
  : ''
const handlerStub = `  http.get('${mswPath}', async () => {
    await delay(NETWORK_DELAY_MS)
    const session = requireSession()
    if (!session) return unauthorized()
${permissionCheck}    return jsonError(501, 'not_implemented', '${operationId} is not implemented in the mock yet')
  }),
`
handlers = `${handlers.slice(0, -'\n]\n'.length)}\n\n${handlerStub}]\n`

let status = read('status')
const statusEnd = status.indexOf('\n\n## Keeping this table true')
if (statusEnd === -1 || status[statusEnd - 1] !== '|') {
  fail('docs/contract-status.md format not recognized; add the row by hand')
}
const statusRow = `| \`GET ${urlPath}\` | \`modules/${id}/queries/use${thing}.ts\` | Proposed | Placeholder response schema; the mock answers 501 |`
status = `${status.slice(0, statusEnd)}\n${statusRow}${status.slice(statusEnd)}`

writeFileSync(files.yaml, yaml)
writeFileSync(files.client, client)
writeFileSync(files.facade, facade)
writeFileSync(files.hook, hook)
writeFileSync(files.handlers, handlers)
writeFileSync(files.status, status)

// Skipped by the generator test, which runs in a temp folder without pnpm or prettier.
if (!process.env.NEW_ENDPOINT_SKIP_POSTPROCESS) {
  execFileSync('pnpm', ['codegen:api'], { cwd: repoRoot, stdio: 'ignore' })
  execFileSync(
    'pnpm',
    [
      'exec',
      'prettier',
      '--write',
      ...['yaml', 'client', 'facade', 'hook', 'handlers', 'status'].map((k) => files[k]),
    ],
    { cwd: appRoot, stdio: 'ignore' },
  )
}

console.log(`Endpoint GET ${urlPath} (${operationId}) added to module "${id}".

Next steps:
  1. openapi.yaml: describe the response and replace the placeholder schema ${schemaName}; run pnpm codegen:api.
  2. Mock: fill the stub in src/mocks/handlers.ts (data in db.ts, PII masking in mask.ts).
  3. ${permission ? `Gate the hook with enabled: can('${permission}') for roles that must not fire the request.` : 'If only some roles may call it, add can(...) in the handler and gate the hook with enabled.'}
  4. Tests: client method in packages/api-client/src/index.test.ts, components with renderWithProviders.
  5. Run pnpm check.`)

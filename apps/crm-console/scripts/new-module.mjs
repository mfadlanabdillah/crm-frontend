/**
 * Creates the skeleton of a new CRM module.
 *
 *   pnpm new:module <id> [--path /<path>] [--icon <LucideIconName>] [--permission <module.action>]
 *   example: pnpm new:module customer --path /customers --icon UsersRound --permission customer.view
 *
 * With --permission, module.ts carries `permission` and the route gets a `requirePermission` guard.
 * The permission itself must still be added to packages/auth/src/roles.ts.
 *
 * Output:
 *   src/modules/<id>/{module.ts,public.ts,api,queries,schemas,pages}
 *   src/routes/_authenticated/<path>/index.tsx  (thin route)
 *   an entry in src/app/modules/registry.ts
 *   a placeholder `<camel>.title` in both locales of packages/i18n/src/resources.ts
 * Then runs `tsr generate`. The skeleton must pass `pnpm lint` and `pnpm typecheck` before it is
 * filled in. i18n text and the permission are added by hand (see the message printed at the end).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const src = path.join(appRoot, 'src')

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const id = args.find((arg, i) => !arg.startsWith('--') && !(i > 0 && args[i - 1]?.startsWith('--')))

function fail(message) {
  console.error(`new:module: ${message}`)
  process.exit(1)
}

if (!id) fail('usage: pnpm new:module <id> [--path /<path>] [--icon <LucideIconName>]')
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id))
  fail('id must be lowercase kebab-case, e.g. "customer"')

const urlPath = flag('--path') ?? `/${id}s`
if (!/^\/[a-z0-9-]+$/.test(urlPath)) fail('--path must look like "/some-path" (one segment)')
const routeDir = urlPath.slice(1)
const permission = flag('--permission')
if (permission && !/^[a-z]+(\.[a-z]+)+$/.test(permission)) {
  fail('--permission must look like "module.action", e.g. customer.view')
}
const icon = flag('--icon') ?? 'Box'
if (!/^[A-Z][A-Za-z0-9]+$/.test(icon))
  fail('--icon must be a lucide-react icon name, e.g. UsersRound')

const moduleDir = path.join(src, 'modules', id)
const routeFile = path.join(src, 'routes/_authenticated', routeDir, 'index.tsx')
if (existsSync(moduleDir)) fail(`modules/${id} already exists`)
if (existsSync(routeFile)) fail(`route ${urlPath} already exists`)

const pascal = id.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
const camel = pascal[0].toLowerCase() + pascal.slice(1)
const routeId = `/_authenticated/${routeDir}/`

const files = {
  [path.join(moduleDir, 'module.ts')]: `import { ${icon} } from 'lucide-react'
import type { ModuleDefinition } from '@/modules/types'

export const ${camel}Module: ModuleDefinition = {
  id: '${id}',
  labelKey: '${camel}.title',
  icon: ${icon},
  basePath: '${urlPath}',
  nav: { to: '${urlPath}' },
  ${permission ? `permission: '${permission}',` : `// permission: '${camel}.view',   // add it in packages/auth/src/roles.ts, then guard the route`}
}
`,
  [path.join(moduleDir, 'public.ts')]: `/**
 * The only entry point other modules may use: queries, schemas, and store, never components.
 * Export here only what another module really needs.
 */
export {}
`,
  [path.join(moduleDir, 'api', `${id}.ts`)]: `/**
 * All ${id} access goes through this facade. Components never call \`fetch\` or \`api\` directly.
 * Add the endpoint in packages/api-client/openapi/openapi.yaml, run \`pnpm codegen:api\`, add the
 * method to packages/api-client/src/index.ts, then wrap it here.
 */
export const ${camel}Api = {}
`,
  [path.join(moduleDir, 'queries', 'keys.ts')]: `export const ${camel}Keys = {
  all: ['${id}'] as const,
  lists: () => [...${camel}Keys.all, 'list'] as const,
  list: (params: unknown) => [...${camel}Keys.lists(), params] as const,
  detail: (${camel}Id: string) => [...${camel}Keys.all, 'detail', ${camel}Id] as const,
}
`,
  [path.join(moduleDir, 'schemas', 'search.ts')]: `import { z } from 'zod'

/** Filters live in the URL; \`.catch()\` keeps stale URLs openable. */
export const ${camel}SearchSchema = z.object({
  q: z.string().trim().max(120).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
})

export type ${pascal}Search = z.infer<typeof ${camel}SearchSchema>

export const DEFAULT_${id.toUpperCase().replace(/-/g, '_')}_SEARCH: ${pascal}Search = ${camel}SearchSchema.parse({})
`,
  [path.join(moduleDir, 'pages', `${pascal}ListPage.tsx`)]:
    `import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@crm/ui'

const route = getRouteApi('${routeId}')

export function ${pascal}ListPage() {
  const { t } = useTranslation()
  const search = route.useSearch()

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl p-6">
        <h2 className="text-base font-semibold text-ink">{t('${camel}.title')}</h2>
        <EmptyState
          title={t('common.emptyTitle')}
          description={search.q ?? t('common.emptyDescription')}
        />
      </div>
    </div>
  )
}
`,
  [routeFile]: `import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
${permission ? "import { requirePermission } from '@/app/auth/guard'\n" : ''}import { ${pascal}ListPage } from '@/modules/${id}/pages/${pascal}ListPage'
import { DEFAULT_${id.toUpperCase().replace(/-/g, '_')}_SEARCH, ${camel}SearchSchema } from '@/modules/${id}/schemas/search'
import type { ${pascal}Search } from '@/modules/${id}/schemas/search'

export const Route = createFileRoute('${routeId}')({
${
  permission
    ? `  beforeLoad: requirePermission('${permission}'),
`
    : ''
}  validateSearch: (search: Record<string, unknown>): ${pascal}Search =>
    ${camel}SearchSchema.parse(search),
  // Keep URLs short: defaults are not written.
  search: { middlewares: [stripSearchParams(DEFAULT_${id.toUpperCase().replace(/-/g, '_')}_SEARCH)] },
  component: ${pascal}ListPage,
})
`,
}

for (const [file, content] of Object.entries(files)) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}
// Presentational pieces live here; git only tracks the folder once a component is added.
mkdirSync(path.join(moduleDir, 'components'), { recursive: true })

// Register in the module registry.
const registryFile = path.join(src, 'app/modules/registry.ts')
let registry = readFileSync(registryFile, 'utf8')
const importLine = `import { ${camel}Module } from '@/modules/${id}/module'\n`
const importRe = /^import .*\n/gm
const lastImport = [...registry.matchAll(importRe)].at(-1)
const arrayRe = /export const modules: readonly ModuleDefinition\[\] = \[([^\]]*)\]/
if (!lastImport || !arrayRe.test(registry)) {
  fail('registry.ts format not recognized; register the module by hand')
}
registry =
  registry.slice(0, lastImport.index + lastImport[0].length) +
  importLine +
  registry.slice(lastImport.index + lastImport[0].length)
registry = registry.replace(arrayRe, (_, list) => {
  const items = list
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return `export const modules: readonly ModuleDefinition[] = [${[...items, `${camel}Module`].join(', ')}]`
})
writeFileSync(registryFile, registry)

// A placeholder title in both locales keeps the i18n parity test green; translate it afterwards.
const resourcesFile = path.join(appRoot, '../../packages/i18n/src/resources.ts')
const localeEndRe = /\n\} as const\n(?=\n(?:const enUS|export const resources))/g
let resources = readFileSync(resourcesFile, 'utf8')
const i18nAdded =
  resources.match(localeEndRe)?.length === 2 && !resources.includes(`\n  ${camel}: {`)
if (i18nAdded) {
  resources = resources.replace(localeEndRe, `\n  ${camel}: { title: '${pascal}' },\n} as const\n`)
  writeFileSync(resourcesFile, resources)
}

// Skipped by the generator test, which runs in a temp folder without tsr/prettier.
if (!process.env.NEW_MODULE_SKIP_POSTPROCESS) {
  execFileSync('pnpm', ['exec', 'tsr', 'generate'], { cwd: appRoot, stdio: 'ignore' })
  execFileSync('pnpm', ['exec', 'prettier', '--write', moduleDir, routeFile, registryFile], {
    cwd: appRoot,
    stdio: 'ignore',
  })
}

console.log(`Module "${id}" created in src/modules/${id} (route ${urlPath}) and registered in the registry.

Next steps:
  1. UI text: ${
    i18nAdded
      ? `translate the placeholder "${camel}.title" in packages/i18n/src/resources.ts, both locales, and add any other text.`
      : `add "${camel}.title" (and any other text) to packages/i18n/src/resources.ts, both locales.`
  }
  2. Permission: ${
    permission
      ? `add "${permission}" to packages/auth/src/roles.ts (module.ts and the route already use it).`
      : `add "${camel}.view" to packages/auth/src/roles.ts, enable the "permission" line in
     modules/${id}/module.ts, and add beforeLoad: requirePermission(...) to the route (or run the
     generator again with --permission).`
  }
  3. API contract: openapi.yaml -> pnpm codegen:api -> facade in modules/${id}/api/${id}.ts.
  4. Dev mock: MSW handler in src/mocks/handlers.ts.
  5. Run pnpm lint && pnpm typecheck && pnpm test.`)

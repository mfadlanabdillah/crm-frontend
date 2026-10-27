/**
 * Membuat kerangka modul CRM baru.
 *
 *   pnpm new:module <id> [--path /<path>] [--icon <NamaIkonLucide>] [--permission <modul.aksi>]
 *   contoh: pnpm new:module customer --path /customers --icon UsersRound --permission customer.view
 *
 * Dengan --permission, module.ts memuat `permission` dan route diberi guard `requirePermission`.
 * Izin itu tetap harus ditambahkan di packages/auth/src/roles.ts.
 *
 * Hasil:
 *   src/modules/<id>/{module.ts,public.ts,api,queries,schemas,pages}
 *   src/routes/_authenticated/<path>/index.tsx  (route tipis)
 *   entri di src/app/modules/registry.ts
 * Lalu menjalankan `tsr generate`. Kerangka harus lolos `pnpm lint` dan `pnpm typecheck`
 * sebelum diisi. Teks i18n dan izin (permission) ditambahkan manual (lihat pesan di akhir).
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

if (!id) fail('pakai: pnpm new:module <id> [--path /<path>] [--icon <NamaIkonLucide>]')
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id))
  fail('id harus kebab-case huruf kecil, mis. "customer"')

const urlPath = flag('--path') ?? `/${id}s`
if (!/^\/[a-z0-9-]+$/.test(urlPath)) fail('--path harus berbentuk "/nama-path" (satu segmen)')
const routeDir = urlPath.slice(1)
const permission = flag('--permission')
if (permission && !/^[a-z]+(\.[a-z]+)+$/.test(permission)) {
  fail('--permission harus berbentuk "modul.aksi", mis. customer.view')
}
const icon = flag('--icon') ?? 'Box'
if (!/^[A-Z][A-Za-z0-9]+$/.test(icon)) fail('--icon harus nama ikon lucide-react, mis. UsersRound')

const moduleDir = path.join(src, 'modules', id)
const routeFile = path.join(src, 'routes/_authenticated', routeDir, 'index.tsx')
if (existsSync(moduleDir)) fail(`modules/${id} sudah ada`)
if (existsSync(routeFile)) fail(`route ${urlPath} sudah ada`)

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
  ${permission ? `permission: '${permission}',` : `// permission: '${camel}.view',   // tambahkan di packages/auth/src/roles.ts, lalu guard route`}
}
`,
  [path.join(moduleDir, 'public.ts')]: `/**
 * Satu-satunya pintu masuk modul lain ke modul ini: queries, schemas, dan store saja,
 * bukan komponen. Ekspor di sini hanya yang memang dibutuhkan modul lain.
 */
export {}
`,
  [path.join(moduleDir, 'api', `${id}.ts`)]: `/**
 * Semua akses ${id} lewat facade ini. Komponen tidak memanggil \`fetch\` atau \`api\` langsung.
 * Tambahkan endpoint di packages/api-client/openapi/openapi.yaml, jalankan \`pnpm codegen:api\`,
 * lalu bungkus metodenya di sini.
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

/** Filter hidup di URL; \`.catch()\` membuat URL usang tetap bisa dibuka. */
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
import { EmptyState } from '@/components/ui/data-state'

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
  // URL tetap ringkas: default tidak ikut ditulis.
  search: { middlewares: [stripSearchParams(DEFAULT_${id.toUpperCase().replace(/-/g, '_')}_SEARCH)] },
  component: ${pascal}ListPage,
})
`,
}

for (const [file, content] of Object.entries(files)) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}

// Daftarkan ke registry.
const registryFile = path.join(src, 'app/modules/registry.ts')
let registry = readFileSync(registryFile, 'utf8')
const importLine = `import { ${camel}Module } from '@/modules/${id}/module'\n`
const importRe = /^import \{ \w+ \} from '@\/modules\/[\w-]+\/module'\n/gm
const lastImport = [...registry.matchAll(importRe)].at(-1)
const arrayRe = /export const modules: readonly ModuleDefinition\[\] = \[([^\]]*)\]/
if (!lastImport || !arrayRe.test(registry)) {
  fail('format registry.ts tidak dikenali; daftarkan modul secara manual')
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

// Dilewati oleh test generator, yang berjalan di folder sementara tanpa tsr/prettier.
if (!process.env.NEW_MODULE_SKIP_POSTPROCESS) {
  execFileSync('pnpm', ['exec', 'tsr', 'generate'], { cwd: appRoot, stdio: 'ignore' })
  execFileSync('pnpm', ['exec', 'prettier', '--write', moduleDir, routeFile, registryFile], {
    cwd: appRoot,
    stdio: 'ignore',
  })
}

console.log(`Modul "${id}" dibuat di src/modules/${id} (route ${urlPath}) dan didaftarkan di registry.

Langkah berikutnya:
  1. Teks UI: tambahkan "${camel}.title" (dan teks lain) di packages/i18n/src/resources.ts, kedua locale.
  2. Izin: ${
    permission
      ? `tambahkan "${permission}" di packages/auth/src/roles.ts (module.ts dan route sudah memakainya).`
      : `tambahkan "${camel}.view" di packages/auth/src/roles.ts, aktifkan baris "permission" di
     modules/${id}/module.ts, dan pasang beforeLoad: requirePermission(...) di route (atau ulangi
     generator dengan --permission).`
  }
  3. Kontrak API: openapi.yaml -> pnpm codegen:api -> facade di modules/${id}/api/${id}.ts.
  4. Mock dev: handler MSW di src/mocks/handlers.ts.
  5. Jalankan pnpm lint && pnpm typecheck && pnpm test.`)

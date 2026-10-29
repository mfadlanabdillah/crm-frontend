/**
 * Creates the skeleton of a new micro frontend remote: a separate app the console loads at startup.
 *
 *   pnpm new:remote <id> [--icon <LucideIconName>] [--permission <module.action>] [--port <n>]
 *   example: pnpm new:remote billing --icon Receipt --permission case.export --port 5178
 *
 * Output: apps/crm-<id>/ with package.json, tsconfig.json, vite.config.ts, index.html and
 * src/{module.tsx,<Pascal>Page.tsx,standalone.ts}. The module has one page under /remote/<id> and its
 * own texts under the `<camel>` namespace. Then runs `pnpm install` and Prettier on the new app.
 * A remote that needs its own routes (like crm-cs) adds `routes` to the module by hand.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const appsDir = path.join(appRoot, '..')

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const id = args.find((arg, i) => !arg.startsWith('--') && !(i > 0 && args[i - 1]?.startsWith('--')))

function fail(message) {
  console.error(`new:remote: ${message}`)
  process.exit(1)
}

if (!id)
  fail('usage: pnpm new:remote <id> [--icon <LucideIconName>] [--permission <module.action>]')
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id))
  fail('id must be lowercase kebab-case, e.g. "billing"')
const permission = flag('--permission')
if (permission && !/^[a-z]+(\.[a-z]+)+$/.test(permission)) {
  fail('--permission must look like "module.action", e.g. case.export')
}
const icon = flag('--icon') ?? 'Box'
if (!/^[A-Z][A-Za-z0-9]+$/.test(icon)) fail('--icon must be a lucide-react icon name, e.g. Receipt')

const dir = path.join(appsDir, `crm-${id}`)
if (existsSync(dir)) fail(`apps/crm-${id} already exists`)

const usedPorts = readdirSync(appsDir).flatMap((name) => {
  const config = path.join(appsDir, name, 'vite.config.ts')
  if (!existsSync(config)) return []
  const match = /REMOTE_PORT = (\d+)/.exec(readFileSync(config, 'utf8'))
  return match ? [Number(match[1])] : []
})
const port = flag('--port') ? Number(flag('--port')) : Math.max(5173, ...usedPorts) + 1
if (!Number.isInteger(port) || port < 1024 || port > 65_000)
  fail('--port must be a free port number')
if (usedPorts.includes(port)) fail(`port ${port} is used by another remote`)

const pascal = id.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
const camel = pascal[0].toLowerCase() + pascal.slice(1)
const federationName = `crm_${id.replace(/-/g, '_')}`
const title = pascal

const files = {
  'package.json': `{
  "name": "@crm/crm-${id}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@crm/api-client": "workspace:*",
    "@crm/auth": "workspace:*",
    "@crm/module-contract": "workspace:*",
    "@crm/ui": "workspace:*",
    "@tanstack/react-query": "5.104.5",
    "lucide-react": "1.61.0",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "react-i18next": "17.1.3"
  },
  "devDependencies": {
    "@crm/config-ts": "workspace:*",
    "@module-federation/vite": "1.23.5",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.2",
    "typescript": "5.9.3",
    "vite": "8.3.5"
  }
}
`,
  'tsconfig.json': `{
  "extends": "@crm/config-ts/react-app",
  "include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"]
}
`,
  'index.html': `<!doctype html>
<html lang="id-ID">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CRM ${title} (remote)</title>
  </head>
  <body>
    <p>
      This is a remote: it is meant to be loaded by the console (<code>apps/crm-console</code>)
      through <code>remoteEntry.js</code>.
    </p>
    <script type="module" src="/src/standalone.ts"></script>
  </body>
</html>
`,
  'vite.config.ts': `import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const REMOTE_PORT = ${port}

// Everything that holds state or context must be one instance with the console, or hooks break.
const singleton = { singleton: true, requiredVersion: false } as const

export default defineConfig({
  plugins: [
    federation({
      name: '${federationName}',
      filename: 'remoteEntry.js',
      exposes: { './module': './src/module.tsx' },
      // The console types this remote by hand; skip the generated @mf-types.
      dts: false,
      shared: {
        react: singleton,
        'react-dom': singleton,
        'react-i18next': singleton,
        '@tanstack/react-query': singleton,
        '@crm/auth': singleton,
        '@crm/ui': singleton,
      },
    }),
    // No React Compiler here on purpose: each app compiles on its own.
    react(),
  ],
  server: {
    port: REMOTE_PORT,
    strictPort: true,
    origin: \`http://localhost:\${REMOTE_PORT}\`,
    cors: true,
  },
  preview: { port: ${port - 999}, strictPort: true, cors: true },
  build: { target: 'esnext' },
})
`,
  'src/standalone.ts': `// Vite needs an entry to build; the real entry is \`remoteEntry.js\`, generated by the federation plugin.
export {}
`,
  'src/module.tsx': `import type { RemoteModule } from '@crm/module-contract'
import { ${icon} } from 'lucide-react'
import { getI18n } from 'react-i18next'
import { ${pascal}Page } from './${pascal}Page'

// Texts live under this module's own id; a remote must not write outside its namespace.
const resources = {
  'id-ID': {
    title: '${title}',
    intro: 'Layar ini dimuat dari aplikasi terpisah (crm-${id}).',
  },
  'en-US': {
    title: '${title}',
    intro: 'This screen is loaded from a separate app (crm-${id}).',
  },
} as const

const i18n = getI18n()
for (const [locale, bundle] of Object.entries(resources)) {
  i18n.addResourceBundle(locale, 'translation', { ${camel}: bundle }, true, true)
}

const ${camel}Module = {
  id: '${id}',
  labelKey: '${camel}.title',
  icon: ${icon},
  basePath: '/remote/${id}',
  nav: { to: '/remote/$moduleId', params: { moduleId: '${id}' } },
  ${permission ? `permission: '${permission}',` : `// permission: '${camel}.view',   // add it in packages/auth/src/roles.ts`}
  Page: ${pascal}Page,
} satisfies RemoteModule

export default ${camel}Module
`,
  [`src/${pascal}Page.tsx`]: `import type { RemotePageProps } from '@crm/module-contract'
import { EmptyState, Page, PageHeader } from '@crm/ui'
import { useTranslation } from 'react-i18next'

/** Entry page of the module. \`api\` is the console's API client; use it with TanStack Query. */
export function ${pascal}Page(_props: RemotePageProps) {
  const { t } = useTranslation()

  return (
    <Page>
      <PageHeader title={t('${camel}.title')} description={t('${camel}.intro')} />
      <EmptyState title={t('${camel}.title')} description={t('${camel}.intro')} />
    </Page>
  )
}
`,
}

for (const [relative, content] of Object.entries(files)) {
  const file = path.join(dir, relative)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}

if (!process.env.NEW_REMOTE_SKIP_POSTPROCESS) {
  execFileSync('pnpm', ['install'], { cwd: appsDir, stdio: 'ignore' })
  execFileSync('pnpm', ['exec', 'prettier', '--write', dir], { cwd: appRoot, stdio: 'ignore' })
}

console.log(`Remote "${id}" created in apps/crm-${id} (dev port ${port}).

Next steps:
  1. Permission: ${
    permission
      ? `add "${permission}" to packages/auth/src/roles.ts if it does not exist yet.`
      : `add "${camel}.view" to packages/auth/src/roles.ts and enable the "permission" line in src/module.tsx.`
  }
  2. Run it: pnpm --filter @crm/crm-${id} dev, and start the console with
     VITE_REMOTE_MODULES=${federationName}=http://localhost:${port}/remoteEntry.js
  3. Build the page from @crm/ui; use the console's API client from the page props.
  4. Production: serve the build under its own path and add it to VITE_REMOTE_MODULES (see
     docs/adr/0009-micro-frontends.md); a remote needs the CORS and CSP items there before it ships.
  5. Run pnpm lint && pnpm typecheck && pnpm test.`)

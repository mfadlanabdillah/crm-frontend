import { readdirSync } from 'node:fs'
import config from '@crm/config-eslint'

/**
 * Batas arsitektur apps/crm-console dan apps/crm-cs (lihat AGENTS.md); crm-cs hanya punya modules/ dan lib/:
 *   lib                 ->  tidak boleh mengimpor modules, app, routes
 *   modules/<m>         ->  tidak boleh mengimpor app, routes, atau modul lain (kecuali public.ts)
 *   app                 ->  hanya boleh mengimpor `module.ts` / `public.ts` sebuah modul
 *   routes              ->  bebas (lapisan tipis yang merangkai halaman modul)
 * Daftar modul dibaca dari folder, jadi modul baru otomatis ikut dijaga.
 */
const srcDir = 'apps/crm-console/src'
const appSrcDirs = [srcDir, 'apps/crm-cs/src']
// Dibaca relatif terhadap file ini, bukan cwd, supaya ESLint boleh dijalankan dari subfolder.
const moduleIdsOf = (dir) =>
  readdirSync(new URL(`./${dir}/modules`, import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

const importRule = (patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
})

const leafBoundary = {
  files: [`${srcDir}/lib/**/*.{ts,tsx}`],
  rules: importRule([
    {
      group: ['@/modules/**', '@/app/**', '@/routes/**'],
      message: 'lib is generic: it must not depend on modules, app, or routes.',
    },
  ]),
}

const appBoundary = {
  files: [`${srcDir}/app/**/*.{ts,tsx}`],
  rules: importRule([
    {
      group: ['@/routes/**'],
      message: 'app tidak boleh mengimpor routes.',
    },
    {
      group: ['@/modules/*/**', '!@/modules/*/module', '!@/modules/*/public'],
      message: 'app hanya boleh mengimpor module.ts atau public.ts sebuah modul.',
    },
  ]),
}

const moduleBoundaries = appSrcDirs.flatMap((dir) => {
  const moduleIds = moduleIdsOf(dir)
  return moduleIds.map((id) => ({
    files: [`${dir}/modules/${id}/**/*.{ts,tsx}`],
    rules: importRule([
      {
        group: ['@/app/**', '@/routes/**'],
        message:
          'Modul tidak boleh mengimpor app atau routes. Kebutuhan shell masuk lewat ModuleDefinition.',
      },
      ...moduleIds
        .filter((other) => other !== id)
        .map((other) => ({
          group: [`@/modules/${other}/**`, `!@/modules/${other}/public`],
          message: `Antar-modul hanya lewat @/modules/${other}/public (queries, schemas, store), bukan komponen.`,
        })),
      {
        group: ['../../*', '../../**'],
        message:
          'Gunakan alias @/modules/<modul>/... untuk lintas folder; path relatif tidak boleh keluar dari folder induk.',
      },
    ]),
  }))
})

/** Modules, components, and routes reach the API only through the module facade (`@crm/api-client`). */
const noRawFetch = {
  files: appSrcDirs.flatMap((dir) => [
    `${dir}/modules/**/*.{ts,tsx}`,
    `${dir}/components/**/*.{ts,tsx}`,
    `${dir}/routes/**/*.{ts,tsx}`,
  ]),
  rules: {
    'no-restricted-globals': [
      'error',
      {
        name: 'fetch',
        message:
          'No fetch in modules, components, or routes: call the API through the facade in modules/<id>/api/ (@crm/api-client).',
      },
    ],
  },
}

/**
 * UI standard (docs/ui-standards.md): screens are built from @crm/ui. Raw controls and colors from
 * the Tailwind palette are errors, so a pattern lives in one place and the look changes in one place.
 */
const PALETTE_UTILITY =
  '(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|accent|caret|shadow)-' +
  '(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}'
const paletteColor = {
  selector: `Literal[value=/(^|\\s)(?:${PALETTE_UTILITY}|[a-z:-]*-\\[#[0-9a-fA-F]{3,8}\\])(\\s|$)/]`,
  message:
    'Use a design token (bg-brand, text-ink-muted, bg-success-soft, ...), not a Tailwind palette color or a hex value. See docs/ui-standards.md.',
}
const rawControl = {
  selector:
    "JSXOpeningElement[name.type='JSXIdentifier'][name.name=/^(button|input|select|textarea|table|thead|tbody|tr|th|td)$/]",
  message:
    'Use the component from @crm/ui (Button, Input, Select, Textarea, Table, ...). A virtualized table is the exception: disable this rule on that line and say why.',
}
const notTests = ['**/*.test.{ts,tsx}']
const uiStandardApps = {
  files: ['apps/*/src/**/*.{ts,tsx}'],
  ignores: notTests,
  rules: { 'no-restricted-syntax': ['error', rawControl, paletteColor] },
}
const uiStandardPackage = {
  files: ['packages/ui/src/**/*.{ts,tsx}'],
  ignores: notTests,
  rules: { 'no-restricted-syntax': ['error', paletteColor] },
}

export default [
  ...config,
  leafBoundary,
  appBoundary,
  ...moduleBoundaries,
  noRawFetch,
  uiStandardApps,
  uiStandardPackage,
]

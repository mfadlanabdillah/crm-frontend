import { readdirSync } from 'node:fs'
import config from '@crm/config-eslint'

/**
 * Batas arsitektur apps/crm-agent (lihat AGENTS.md):
 *   lib, components/ui  ->  tidak boleh mengimpor modules, app, routes
 *   modules/<m>         ->  tidak boleh mengimpor app, routes, atau modul lain (kecuali public.ts)
 *   app                 ->  hanya boleh mengimpor `module.ts` / `public.ts` sebuah modul
 *   routes              ->  bebas (lapisan tipis yang merangkai halaman modul)
 * Daftar modul dibaca dari folder, jadi modul baru otomatis ikut dijaga.
 */
const srcDir = 'apps/crm-agent/src'
// Dibaca relatif terhadap file ini, bukan cwd, supaya ESLint boleh dijalankan dari subfolder.
const moduleIds = readdirSync(new URL(`./${srcDir}/modules`, import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const importRule = (patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
})

const leafBoundary = {
  files: [`${srcDir}/lib/**/*.{ts,tsx}`, `${srcDir}/components/ui/**/*.{ts,tsx}`],
  rules: importRule([
    {
      group: ['@/modules/**', '@/app/**', '@/routes/**'],
      message:
        'lib dan components/ui bersifat generik: tidak boleh bergantung pada modul, app, atau routes.',
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

const moduleBoundaries = moduleIds.map((id) => ({
  files: [`${srcDir}/modules/${id}/**/*.{ts,tsx}`],
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

export default [...config, leafBoundary, appBoundary, ...moduleBoundaries]

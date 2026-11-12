#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { format } from 'prettier'
import { buildCatalog, renderCatalog } from './lib/catalog.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Tulis docs/catalog.json + docs/catalog.md; keduanya diformat Prettier supaya `format:check` tetap hijau. */
export async function writeCatalog(target = root) {
  const catalog = buildCatalog(target)
  const markdown = await format(renderCatalog(catalog), { parser: 'markdown' })
  const json = await format(JSON.stringify(catalog), { parser: 'json' })
  writeFileSync(path.join(target, 'docs/catalog.json'), json)
  writeFileSync(path.join(target, 'docs/catalog.md'), markdown)
  return catalog
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = await writeCatalog()
  process.stdout.write(
    `catalog  ${catalog.apps.length} app, ${catalog.remotes.length} remote, ${catalog.modules.length} module, ${catalog.packages.length} package\n`,
  )
}

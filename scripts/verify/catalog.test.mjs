import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { format } from 'prettier'
import { describe, expect, it } from 'vitest'
import { buildCatalog, renderCatalog } from '../lib/catalog.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

describe('catalog', () => {
  it('reads every remote and module from the filesystem', () => {
    const catalog = buildCatalog(root)
    expect(catalog.remotes.map((remote) => remote.moduleName).sort()).toEqual([
      'crm_cs',
      'crm_finance',
      'crm_investigator',
      'crm_monitor',
    ])
    expect(catalog.modules.map((mod) => mod.id).sort()).toEqual([
      'case',
      'customer',
      'finance',
      'investigator',
      'monitor',
    ])
  })

  it('keeps docs/catalog.json and docs/catalog.md current', async () => {
    const catalog = buildCatalog(root)
    const stored = JSON.parse(readFileSync(path.join(root, 'docs/catalog.json'), 'utf8'))
    expect(stored).toEqual(catalog)

    const markdown = await format(renderCatalog(catalog), { parser: 'markdown' })
    expect(readFileSync(path.join(root, 'docs/catalog.md'), 'utf8')).toBe(markdown)
  })
})

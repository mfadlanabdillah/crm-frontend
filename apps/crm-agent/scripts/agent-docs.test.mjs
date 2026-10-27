import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const docs = ['AGENTS.md', 'README.md', 'docs/agents/recipes.md']
const ROOTS = ['apps/', 'packages/', 'docs/', '.github/']

/** Path repo yang ditulis dalam backtick; yang bertemplat (`<id>`, `*`) atau bersifat contoh dilewati. */
function referencedPaths(text) {
  return [...text.matchAll(/`([^`\s]+)`/g)]
    .map((match) => match[1])
    .filter((token) => ROOTS.some((root) => token.startsWith(root)))
    .filter((token) => !/[<>*{}]/.test(token))
    .map((token) => token.replace(/[.,:;)]+$/, ''))
}

describe('dokumen agent', () => {
  it.each(docs)('%s hanya menyebut path yang ada', (doc) => {
    const missing = referencedPaths(readFileSync(path.join(repoRoot, doc), 'utf8')).filter(
      (ref) => !existsSync(path.join(repoRoot, ref)),
    )
    expect(missing).toEqual([])
  })

  it('CLAUDE.md mengimpor AGENTS.md', () => {
    expect(readFileSync(path.join(repoRoot, 'CLAUDE.md'), 'utf8')).toContain('@AGENTS.md')
  })
})

const STATUSES = ['Stable', 'Provisional', 'Proposed', 'Mock only']

/** Every `METHOD /path` declared in openapi.yaml (paths at 2 spaces, methods at 4). */
function openApiOperations() {
  const lines = readFileSync(
    path.join(repoRoot, 'packages/api-client/openapi/openapi.yaml'),
    'utf8',
  ).split('\n')
  const operations = []
  let current = null
  for (const line of lines) {
    const route = line.match(/^ {2}(\/v1\/[^:]+):/)
    if (route) current = route[1]
    const method = line.match(/^ {4}(get|post|put|patch|delete):/)
    if (method && current) operations.push(`${method[1].toUpperCase()} ${current}`)
  }
  return operations
}

describe('docs/contract-status.md', () => {
  const doc = readFileSync(path.join(repoRoot, 'docs/contract-status.md'), 'utf8')

  it('lists every operation in openapi.yaml', () => {
    const operations = openApiOperations()
    expect(operations.length).toBeGreaterThan(0)
    expect(operations.filter((operation) => !doc.includes(`\`${operation}\``))).toEqual([])
  })

  it('gives each endpoint a known status', () => {
    const rows = doc.split('\n').filter((line) => line.startsWith('| `'))
    const unknown = rows
      .map((row) => ({ row, status: row.split('|')[3]?.trim() ?? '' }))
      .filter(({ status }) => !STATUSES.includes(status))
      .map(({ row }) => row.slice(0, 60))
    expect(rows.length).toBeGreaterThan(0)
    expect(unknown).toEqual([])
  })
})

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

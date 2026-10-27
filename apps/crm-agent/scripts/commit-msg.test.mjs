import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const hook = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
  '.husky/commit-msg',
)
let dir

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'commit-msg-'))
})

afterEach(() => rmSync(dir, { recursive: true, force: true }))

function run(message) {
  const file = path.join(dir, 'COMMIT_EDITMSG')
  writeFileSync(file, `${message}\n`)
  return spawnSync('sh', [hook, file], { encoding: 'utf8' })
}

describe('commit-msg hook', () => {
  it.each([
    'feat: add thing',
    'fix(case): handle empty list',
    'refactor!: drop old api',
    'Merge branch development into feature',
    'fixup! feat: add thing',
  ])('accepts %s', (message) => {
    expect(run(message).status).toBe(0)
  })

  it.each(['add thing', 'Feat: add thing', 'feat:', 'feat(Case): x', 'wip: stuff'])(
    'rejects %s',
    (message) => {
      const result = run(message)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Conventional Commits')
    },
  )
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const { scripts } = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))

/** A glob outside quotes is expanded by the shell into several arguments (`--filter ./examples/*` broke `dev:examples`). */
function unquotedGlobs(command) {
  const outsideQuotes = command.replace(/'[^']*'|"[^"]*"/g, '')
  return outsideQuotes.split(/\s+/).filter((word) => word.includes('*'))
}

describe('root package.json scripts', () => {
  it.each(Object.entries(scripts))('%s has no unquoted glob', (_name, command) => {
    expect(unquotedGlobs(command)).toEqual([])
  })
})

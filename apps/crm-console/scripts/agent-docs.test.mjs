import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const docs = [
  'AGENTS.md',
  'README.md',
  'docs/agents/recipes.md',
  'docs/system-design.md',
  'docs/ui-standards.md',
  'docs/onboarding.md',
  'docs/production-readiness.md',
  'examples/README.md',
]
const ROOTS = ['apps/', 'packages/', 'docs/', 'examples/', '.github/']

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

describe('docs/adr', () => {
  const dir = path.join(repoRoot, 'docs/adr')
  const files = readdirSync(dir)
    .filter((file) => /^\d{4}-.+\.md$/.test(file))
    .sort()
  const index = readFileSync(path.join(dir, 'README.md'), 'utf8')

  it('numbers the ADRs from 0001 without gaps or repeats', () => {
    expect(files.length).toBeGreaterThan(0)
    expect(files.map((file) => file.slice(0, 4))).toEqual(
      files.map((_, position) => String(position + 1).padStart(4, '0')),
    )
  })

  it('lists every ADR in the index', () => {
    expect(files.filter((file) => !index.includes(`(${file})`))).toEqual([])
  })

  it.each(files)(
    '%s has a matching title, a valid status, a date, and the required sections',
    (file) => {
      const text = readFileSync(path.join(dir, file), 'utf8')
      expect(text).toMatch(new RegExp(`^# ADR-${file.slice(0, 4)}: .+`, 'm'))
      expect(text).toMatch(/^- Status: (Proposed|Accepted|Deprecated|Superseded by ADR-\d{4})$/m)
      expect(text).toMatch(/^- Date: \d{4}-\d{2}-\d{2}$/m)
      for (const heading of ['Context', 'Decision', 'Consequences', 'Alternatives considered']) {
        expect(text, `${file} lacks "## ${heading}"`).toContain(`\n## ${heading}\n`)
      }
    },
  )
})

describe('docs/onboarding.md: dependency diagram', () => {
  const doc = readFileSync(path.join(repoRoot, 'docs/onboarding.md'), 'utf8')
  const diagram = /```mermaid\nflowchart TD\n {2}subgraph Aplikasi[\s\S]*?```/.exec(doc)?.[0] ?? ''
  // Node ids of the diagram; `other` stands for the three small examples.
  const nodes = {
    shell: ['@crm/crm-console'],
    cs: ['@crm/crm-cs'],
    other: ['@crm/crm-finance', '@crm/crm-investigator', '@crm/crm-monitor'],
    mockb: ['@crm/example-mock-backend'],
    ui: ['@crm/ui'],
    appkit: ['@crm/app-kit'],
    contract: ['@crm/module-contract'],
    auth: ['@crm/auth'],
    i18n: ['@crm/i18n'],
    apic: ['@crm/api-client'],
  }

  function documentedEdges() {
    const edges = new Set()
    for (const [, from, targets] of diagram.matchAll(/^ {2}(\w+) --> (.+)$/gm)) {
      for (const target of targets.split('&').map((name) => name.trim())) {
        if (!nodes[from] || !nodes[target])
          throw new Error(`diagram node not known to the test: ${from} or ${target}`)
        for (const source of nodes[from])
          for (const dest of nodes[target]) edges.add(`${source} -> ${dest}`)
      }
    }
    return edges
  }

  function actualEdges() {
    const edges = new Set()
    for (const parent of ['apps', 'examples', 'packages']) {
      for (const name of readdirSync(path.join(repoRoot, parent))) {
        const file = path.join(repoRoot, parent, name, 'package.json')
        if (!existsSync(file)) continue
        const pkg = JSON.parse(readFileSync(file, 'utf8'))
        for (const dep of Object.keys(pkg.dependencies ?? {})) {
          if (dep.startsWith('@crm/')) edges.add(`${pkg.name} -> ${dep}`)
        }
      }
    }
    return edges
  }

  it('shows exactly the @crm dependencies in package.json (dev dependencies are left out)', () => {
    const documented = documentedEdges()
    const actual = actualEdges()
    expect({
      missingInDoc: [...actual].filter((edge) => !documented.has(edge)),
      notInPackages: [...documented].filter(
        (edge) => !actual.has(edge) && !edge.startsWith('@crm/ui -> @crm/i18n'),
      ),
    }).toEqual({ missingInDoc: [], notInPackages: [] })
  })
})

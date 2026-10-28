/**
 * Menghitung initial JS (gzip) dengan menelusuri import statis dari entry
 * build Vite. Route yang di-lazy-load tidak dihitung di angka ini; budget per route
 * (entry + chunk route) ≤ 300 KB gzip diperiksa terpisah di bawah.
 */
import { gzipSync } from 'node:zlib'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BUDGET_BYTES = 300 * 1024
const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const distDir = path.join(appRoot, 'dist')
const manifestPath = path.join(distDir, '.vite', 'manifest.json')

let manifest
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
} catch {
  console.error('Manifest tidak ditemukan. Jalankan `pnpm build` dulu.')
  process.exit(1)
}

const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry)
if (!entryKey) {
  console.error('Tidak ada entry di manifest Vite.')
  process.exit(1)
}

async function gzipTotal(startKeys, log = false) {
  const visited = new Set()
  const queue = [...startKeys]
  let total = 0

  while (queue.length > 0) {
    const key = queue.pop()
    if (key === undefined || visited.has(key)) continue
    visited.add(key)

    const chunk = manifest[key]
    if (!chunk) continue
    const filePath = path.join(distDir, chunk.file)
    await stat(filePath)
    const gzipped = gzipSync(await readFile(filePath), { level: 9 })
    total += gzipped.length
    if (log)
      console.log(`${String(Math.round(gzipped.length / 1024)).padStart(5)} KB  ${chunk.file}`)
    for (const imported of chunk.imports ?? []) queue.push(imported)
  }
  return total
}

const fmt = (bytes) => (bytes / 1024).toFixed(1)
const overBudget = []

const initial = await gzipTotal([entryKey], true)
console.log(`\nInitial JS: ${fmt(initial)} KB gzip (budget ${BUDGET_BYTES / 1024} KB)`)
if (initial > BUDGET_BYTES) overBudget.push(`initial (+${fmt(initial - BUDGET_BYTES)} KB)`)

const routeKeys = Object.keys(manifest).filter(
  (key) => manifest[key].isDynamicEntry && key.startsWith('src/routes/'),
)
console.log('\nPer route (entry + chunk route):')
for (const key of routeKeys) {
  const total = await gzipTotal([entryKey, key])
  const name = key.replace(/^src\/routes\//, '').replace(/\?.*$/, '')
  console.log(`${fmt(total).padStart(7)} KB  ${name}`)
  if (total > BUDGET_BYTES) overBudget.push(`${name} (+${fmt(total - BUDGET_BYTES)} KB)`)
}

if (overBudget.length > 0) {
  console.error(`\nBudget terlampaui: ${overBudget.join(', ')}.`)
  process.exit(1)
}

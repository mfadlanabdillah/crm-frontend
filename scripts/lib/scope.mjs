import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

/** git dengan keluaran string; melempar kalau perintah gagal. */
export function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

/** git yang boleh gagal (ref tidak ada, merge-base tidak ketemu). */
export function gitOrNull(root, args) {
  try {
    return git(root, args)
  } catch {
    return null
  }
}

/**
 * Pola dari blok `packages:` di pnpm-workspace.yaml.
 * Blok lain (onlyBuiltDependencies) ikut berbentuk daftar, jadi bloknya dibatasi.
 */
export function readWorkspaceGlobs(root) {
  const file = path.join(root, 'pnpm-workspace.yaml')
  if (!existsSync(file)) return []
  const globs = []
  let inPackages = false
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true
      continue
    }
    if (/^\S/.test(line)) {
      inPackages = false
      continue
    }
    if (!inPackages) continue
    const match = line.match(/^\s*-\s*['"]?([^'"#]+?)['"]?\s*$/)
    if (match) globs.push(match[1])
  }
  return globs
}

/** `apps/*` -> `apps/crm-console`. Hanya wildcard di akhir yang didukung. */
function expandGlob(root, pattern) {
  const wildcard = pattern.match(/^(.*)\/\*$/)
  if (!wildcard) return [pattern]
  const parent = wildcard[1]
  const dir = path.join(root, parent)
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => `${parent}/${entry.name}`)
}

/** Paket workspace: nama, direktori relatif, dan isi package.json. */
export function workspacePackages(root) {
  const dirs = readWorkspaceGlobs(root)
    .flatMap((pattern) => expandGlob(root, pattern))
    .filter((dir) => existsSync(path.join(root, dir, 'package.json')))
  return dirs.map((dir) => ({
    name: JSON.parse(readFileSync(path.join(root, dir, 'package.json'), 'utf8')).name,
    dir,
    abs: path.join(root, dir),
    json: JSON.parse(readFileSync(path.join(root, dir, 'package.json'), 'utf8')),
  }))
}

/** Paket pemilik sebuah file; paket terdalam yang direktorinya menjadi prefix. */
export function packageForPath(packages, file) {
  const target = file.split(path.sep).join('/')
  const owners = packages.filter((pkg) => target === pkg.dir || target.startsWith(`${pkg.dir}/`))
  return owners.sort((a, b) => b.dir.length - a.dir.length)[0]?.name ?? null
}

/** Paket yang bergantung langsung pada `name`. */
export function dependentsOf(packages, name) {
  return packages
    .filter((pkg) => {
      const deps = { ...pkg.json.dependencies, ...pkg.json.devDependencies }
      return Object.hasOwn(deps, name)
    })
    .map((pkg) => pkg.name)
}

/**
 * Ref pembanding. Urutan: --base, origin/development, development, HEAD~1.
 * merge-base dipakai supaya perubahan di branch lain tidak ikut terhitung.
 */
export function resolveBase(root, explicit) {
  const candidates = explicit ? [explicit] : ['origin/development', 'development', 'HEAD~1']
  for (const ref of candidates) {
    const commit = gitOrNull(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])
    if (!commit) {
      if (explicit) throw new Error(`base ref not found: ${ref}`)
      continue
    }
    return { base: ref, mergeBase: gitOrNull(root, ['merge-base', 'HEAD', ref]) ?? commit }
  }
  throw new Error('cannot resolve a base ref; pass --base <ref>')
}

/** File berubah terhadap merge-base, termasuk yang belum di-stage dan untracked. */
export function changedFiles(root, mergeBase) {
  const tracked = git(root, ['diff', '--name-only', '--diff-filter=ACMR', mergeBase, '--'])
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard'])
  return [...new Set([...tracked.split('\n'), ...untracked.split('\n')].filter(Boolean))].sort()
}

/**
 * Cakupan kerja.
 * - files: file berubah (kosong untuk --all)
 * - changed: paket yang punya file berubah
 * - affected: changed + dependen satu tingkat, untuk typecheck
 */
export function resolveScope({ root, base, all = false }) {
  const packages = workspacePackages(root)
  if (all) {
    const names = packages.map((pkg) => pkg.name)
    return { base: null, mergeBase: null, files: [], changed: names, affected: names, packages }
  }
  const { base: ref, mergeBase } = resolveBase(root, base)
  const files = changedFiles(root, mergeBase)
  const changed = [
    ...new Set(files.map((file) => packageForPath(packages, file)).filter(Boolean)),
  ].sort()
  const affected = new Set(changed)
  for (const name of changed) {
    for (const dependent of dependentsOf(packages, name)) affected.add(dependent)
  }
  return {
    base: ref,
    mergeBase,
    files,
    changed,
    affected: [...affected].sort(),
    packages,
  }
}

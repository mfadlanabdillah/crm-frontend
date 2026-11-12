import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const SCHEMA_VERSION = 1

/** Satu langkah selalu punya bentuk yang sama, termasuk saat dilewati. */
export function step({ id, status, durationMs = 0, command = null, failures = [], reason = null }) {
  return { id, status, durationMs, command, failures, reason }
}

export function skipped(id, reason) {
  return step({ id, status: 'skip', reason })
}

export function buildReport(scope, steps) {
  const failed = steps.filter((s) => s.status === 'fail').length
  const passed = steps.filter((s) => s.status === 'pass').length
  const skippedCount = steps.filter((s) => s.status === 'skip').length
  return {
    schemaVersion: SCHEMA_VERSION,
    startedAt: null,
    durationMs: 0,
    scope: {
      base: scope.base,
      mergeBase: scope.mergeBase,
      files: scope.files.length,
      changed: scope.changed,
      affected: scope.affected,
    },
    steps,
    summary: {
      status: failed > 0 ? 'fail' : 'pass',
      passed,
      failed,
      skipped: skippedCount,
    },
  }
}

export function writeReport(report, target) {
  const text = `${JSON.stringify(report, null, 2)}\n`
  if (target === '-') {
    process.stdout.write(text)
    return
  }
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, text)
}

export function exitCode(report) {
  return report.summary.status === 'pass' ? 0 : 1
}

/**
 * Regenerate `src/generated/openapi.d.ts` from the OpenAPI contract.
 *
 * Usage:
 *   pnpm codegen:api                                  # pakai spec lokal
 *   OPENAPI_SPEC=https://.../openapi.json pnpm codegen:api
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

const specInput = process.env.OPENAPI_SPEC
const spec = specInput
  ? specInput.startsWith('http')
    ? new URL(specInput)
    : pathToFileURL(specInput)
  : pathToFileURL(fileURLToPath(new URL('../openapi/openapi.yaml', import.meta.url)))
const output = fileURLToPath(new URL('../src/generated/openapi.d.ts', import.meta.url))

const ast = await openapiTS(spec)
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, astToString(ast))
console.log(`Kontrak API diperbarui dari ${String(spec)}`)

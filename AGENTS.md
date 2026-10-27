# AGENTS.md

Rules for AI coding agents and developers in this repo. Step-by-step recipes per task type are in
[docs/agents/recipes.md](docs/agents/recipes.md); read the matching one before you start.

## Working agreement

1. Find an existing pattern before writing new code. References: module `case` (complete) and `customer` (minimal) in `apps/crm-agent/src/modules/`.
2. Change as little as possible, only what was asked. No drive-by cleanups.
3. Run the verification below and report results as they are. Never claim "passes" without running the command; on failure, show the real error.
4. If the API contract, a business rule, or the scope is unclear, ask. Do not invent endpoints, fields, or enums.

## Context

- **Repo:** `crm-frontend`, a pnpm monorepo. **App:** `apps/crm-agent`, the customer-service agent console SPA (phase 1 = case record type `CS`).
- **Stack:** React 19, Vite 8, TypeScript strict, TanStack Router/Query/Table/Virtual, Zustand, Tailwind CSS 4 (shadcn/ui pattern), Zod + React Hook Form (`@hookform/resolvers`), Tiptap, i18next, MSW, Vitest, Playwright.
- **Backend:** Go BFF. Contract: `packages/api-client/openapi/openapi.yaml` (provisional); types and client are generated from it. Which endpoints can be trusted is tracked in [docs/contract-status.md](docs/contract-status.md).
- **Domain status:** the skeleton uses a generic model (4 statuses, queues l1/l2/escalated, 4 roles). Record type `CS`, taxonomy, tiers, and data scope are not applied yet. Treat it as a pattern example.
- **Terms:** "CS agent" (Indonesian: agen CS) is the customer-service staff member who uses the console; "AI agent" is a coding assistant reading this file. The app name `crm-agent` refers to the first.
- **Glossary:** STT = shipment tracking number (Surat Tanda Terima) · Case = CS ticket (status, priority, queue, owner per tier) · Escalation tiers L1 (Frontline) -> L2 (Backline) -> L3; SWAT, Investigator, 3LC · DEX = Delivery Exception · RTS = Return to Sender · COD = Cash on Delivery · POD = Proof of Delivery · PII = phone, address, email, bank account, national ID; always masked by the server/BFF according to permission.

## Verify (definition of done)

| Command                            | When                                                                                                                                                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                       | Must be green before you finish; same as CI: format check, lint, typecheck, tests + coverage floor, build, size, OpenAPI drift (`codegen:check` diffs against the index: stage regenerated files first)                                        |
| `pnpm exec vitest run <test-file>` | Fast loop on one unit                                                                                                                                                                                                                          |
| `pnpm lint` / `pnpm typecheck`     | Fast loop for types and layer boundaries                                                                                                                                                                                                       |
| `pnpm test:e2e`                    | Flow, routing, auth, or UI changes. Includes the axe accessibility scan (WCAG 2.1 AA). Needs the browser once: `pnpm --filter @crm/crm-agent exec playwright install chromium` (add `--with-deps` on a fresh Linux/WSL machine; it needs sudo) |
| `pnpm format`                      | Fixes formatting; CI runs `pnpm format:check`                                                                                                                                                                                                  |
| `pnpm codegen:api`                 | After editing `openapi.yaml`; CI fails if the result differs from what is committed                                                                                                                                                            |

## Repo map

```text
apps/crm-agent/src
  routes/            # file-based routing; thin: validateSearch + guard + a page from a module
  modules/<id>/      # one folder per CRM module (case, customer, ...)
    module.ts        #   ModuleDefinition: nav, permission, sidebar/tab slots, realtime hook, onSignOut
    public.ts        #   the only entry point for other modules (queries, schemas, store)
    api/ queries/ schemas/ components/ pages/ store/
  modules/types.ts   # ModuleDefinition contract
  app/               # shell: layout/AppShell, auth/, modules/registry (module list)
  components/ui      # shadcn-style primitives (styling only)
  lib/               # helpers that know nothing about modules (+ *.test.ts)
  mocks/             # MSW handlers + in-memory db + mock masking (dev only, not in the prod bundle)
packages/
  api-client/  auth/  i18n/  test-utils/  config-ts/  config-eslint/
```

| To add...         | Put it in...                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| CRM module        | `pnpm new:module <id> --path /<path>` (skeleton + route + registry entry)                                                                        |
| Page / URL        | thin route in `src/routes/`; page body in `src/modules/<id>/pages/`                                                                              |
| Module component  | `src/modules/<id>/components/`                                                                                                                   |
| Generic primitive | `src/components/ui/`                                                                                                                             |
| API endpoint      | GET: `pnpm new:endpoint`; otherwise `openapi.yaml`, `pnpm codegen:api`, method in `packages/api-client/src/index.ts`, facade `modules/<id>/api/` |
| Permission        | `packages/auth/src/roles.ts`                                                                                                                     |
| UI text           | `packages/i18n/src/resources.ts` (both locales)                                                                                                  |
| Dev mock          | `src/mocks/handlers.ts` (+ `db.ts`; per-role masking in `mocks/mask.ts`)                                                                         |

### Layer boundaries (enforced by ESLint, `eslint.config.js`)

- `lib/` and `components/ui/` must not import `modules/`, `app/`, or `routes/`.
- `modules/<m>/` must not import `app/`, `routes/`, or another module, except `@/modules/<other>/public` (queries, schemas, store; never components). Cross-module links go through routes (`<Link to="/customers/$customerId">`).
- Inside a module, cross-folder imports use the alias `@/modules/<m>/...`; relative paths must not climb with `../../`.
- `app/` imports only a module's `module.ts` / `public.ts`; modules reach the shell through `app/modules/registry.ts`.
- Used by 3+ modules: move it to `lib/`, `components/ui/`, or a package.

## Rules

**Data and state**

- Server state in TanStack Query; Zustand holds UI state only, never server data.
- Filters and pagination live in the URL (search params + zod, `.catch()` for stale URLs).
- Forms use React Hook Form + a zod schema with i18n-key messages and `FormField`; follow `modules/case/components/CaseForm.tsx` (recipe: "Add a form").
- No `fetch` in components and no data fetching in `useEffect`. API calls go through the facade in `modules/<id>/api/`. ESLint rejects `fetch` in `modules/`, `components/`, and `routes/`.
- Master data (status, queue, priority, taxonomy) comes from the API (`GET /v1/master-data` via `useMasterData`: code, label, badge tone). Do not hardcode business enums; URL search and SSE events accept any code.
- A 401 is handled globally (`lib/query-client.ts` + `app/auth/session-expiry.ts`). Do not handle 401 per page.

**Security and PII**

- No tokens in `localStorage`/`sessionStorage`. Session is an `HttpOnly` cookie via the BFF; send `X-CSRF-Token` on non-safe methods.
- Real masking happens on the server/BFF. The mock (`mocks/mask.ts`) imitates it, and the UI still calls `maskPhone`/`maskEmail`/`maskAddress` as a second layer.
- Permissions via `can()` / `<Can>` and `requirePermission` on routes. Never `role === '...'` in components.
- No real PII, secrets, or tokens in code, fixtures, logs, or commit messages. Every `VITE_*` variable is public.

**UI**

- Tailwind only, no CSS-in-JS; use `cn` from `@/lib/cn`.
- UI text exists in both locales (`id-ID` default, `en-US`); a test in `packages/i18n` rejects mismatched keys or `{{...}}` placeholders.
- Accessibility: labels/aria on interactive elements, WCAG AA contrast, managed focus. `e2e/a11y.spec.ts` axe-scans the main pages and must stay clean. Never use an ARIA role without the matching children/pattern.
- Large tables use `useVirtualizer`; heavy libraries (e.g. Tiptap in `ReplyComposer`) load via `lazy()` + `Suspense`.

**Code quality**

- TypeScript strict with `noUncheckedIndexedAccess`; no `any` (use `unknown`); handle `undefined` from indexing instead of `!`.
- `import type` for types; `eqeqeq`; `no-console` except `warn`/`error`; Prettier: single quotes, trailing commas, width 100.
- Skip needless comments and docstrings; use clear names. Comment only non-obvious logic, workarounds, and edge cases.
- Tests sit next to the code as `*.test.ts(x)`. Non-trivial new logic needs a test, critical flows need e2e. UI added without a unit test can trip the coverage floor: split the markup into a component and test it (`renderWithRouter` from `@crm/test-utils` when it has a `Link`). `pnpm test` enforces a coverage floor in `vitest.config.ts`; raise it as tests grow.
- Bundle budget: initial JS and every route (entry + route chunk) <= 300 KB gzip (`pnpm size`).

## Language policy

- **English:** code, comments, test names, commit messages, ESLint messages, and technical docs (`AGENTS.md`, `docs/`).
- **Indonesian:** `README.md` and product text (the `id-ID` locale); `en-US` mirrors it.
- Older code still has Indonesian comments, test names, and lint messages. Translate them when you touch that code; do not mass-rewrite.

## Do not edit by hand

| File                                             | How it is updated                                      |
| ------------------------------------------------ | ------------------------------------------------------ |
| `apps/crm-agent/src/routeTree.gen.ts`            | Generated by the router plugin during `pnpm dev`/build |
| `packages/api-client/src/generated/openapi.d.ts` | `pnpm codegen:api`                                     |
| `apps/crm-agent/public/mockServiceWorker.js`     | Generated by MSW                                       |
| `pnpm-lock.yaml`                                 | `pnpm add` / `remove` / `install`                      |

## Known pitfalls

- **The mock session lives in page memory.** In e2e, import `test` from `apps/crm-agent/e2e/support.ts`: the `signedInPage` fixture starts signed in on `/cases`, `clientNavigate` moves through the router (never `page.goto` after signing in or out), and `endSession` ends the session safely.
- **E2E runs with 2 workers on purpose** (`apps/crm-agent/playwright.config.ts`). Each worker is a Chromium; 2-4 workers take the same ~25 s, but 6 fail every run and 3 time out when RAM/swap is tight (seen on an 8 GB machine). Do not raise it without re-measuring. If e2e fails only when the machine is swapping, free memory before suspecting the code.
- **i18n `resources` use `as const`**, so TypeScript cannot see a key missing in one locale; the parity test catches it.
- **Mocks run only in dev** (`import.meta.env.DEV`). Production builds exclude MSW, and the image drops `*.map` and `mockServiceWorker.js`.
- **Session expiry vs logout:** `ModuleDefinition.onSignOut(reason)` receives `'logout'` or `'expired'`. Unsent drafts are deleted only on `logout`.

## Agent boundaries

- **Git:** no `git add`, `commit`, `push`, or opening a PR without an explicit instruction. Read-only (`status`, `diff`, `log`) is fine. Commits use Conventional Commits (`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`); the `.husky/commit-msg` hook rejects other subjects.
- **Sensitive files:** never print `.env*` with `cat`/`head`/`tail`/`echo`; use the file-read tool.
- **Dependencies:** do not add a package for a few lines of code. If one is needed, pin the exact version and explain why.
- **CI, Docker, nginx, security headers, lockfile:** change only when the task is about them.
- **Scope:** frontend in this repo only. Anything that depends on the backend/BFF is recorded as an assumption on the provisional contract, not implemented.
- **Replies:** short and direct; no praise or validation.

## Git, PRs, environment

Branches: `feature/`, `bugfix/`, `hotfix/`, `release/`; flow `development` -> `staging` -> `master`. Open PRs against `development`. A PR needs a green `pnpm check`, a "why", and screenshots for UI changes. CI runs `format:check`, `pnpm check`, the OpenAPI drift check, e2e (+ axe), and an image build (`nginx -t`, no `*.map`/`mockServiceWorker.js`). Environment variables are listed in `apps/crm-agent/.env.example` (copy it to `.env.local`); Docker takes `VITE_API_BASE_URL` and `VITE_TELEMETRY_URL` as build args.

## Keep the docs true

Record decisions that are costly to reverse as ADRs in `docs/adr/` (when to write one, and the template, are in `docs/adr/README.md`). Do not rewrite an accepted ADR; supersede it with a new one.

When structure, commands, or rules change, update `README.md` and this file. `apps/crm-agent/scripts/agent-docs.test.mjs` fails when a repo path mentioned in the docs no longer exists, or when an operation in `openapi.yaml` is missing from `docs/contract-status.md` or has an unknown status. When the API contract changes, update `openapi.yaml`, run `pnpm codegen:api`, update the mock, and update `docs/contract-status.md`.

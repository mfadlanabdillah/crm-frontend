# AGENTS.md

Rules for AI coding agents and developers in this repo. Step-by-step recipes per task type are in
[docs/agents/recipes.md](docs/agents/recipes.md); read the matching one before you start. How the system fits
together is in [docs/system-design.md](docs/system-design.md); UI rules are in [docs/ui-standards.md](docs/ui-standards.md).

## Working agreement

1. Find an existing pattern before writing new code. References: module `case` (complete) and `customer` (minimal) in `examples/crm-cs/src/modules/`.
2. Change as little as possible, only what was asked. No drive-by cleanups.
3. Run the verification below and report results as they are. Never claim "passes" without running the command; on failure, show the real error.
4. If the API contract, a business rule, or the scope is unclear, ask. Do not invent endpoints, fields, or enums.

## Context

- **Repo:** `crm-frontend`, a pnpm monorepo and a boilerplate for CRM modules. **App:** `apps/crm-console` is the shell (login, layout, navigation, router, mocks); it ships no domain screens and starts with an empty state when no remote loads. **Remotes:** separate apps the shell loads at startup through Module Federation (contract in `packages/module-contract`). `examples/` holds working examples: `examples/crm-cs` (customer service: modules `case` and `customer`, record type `CS`) and three smaller ones (`crm-finance`, `crm-investigator`, `crm-monitor`); see `examples/README.md`. They are examples, not product. New remotes go in `apps/` (`pnpm new:remote`).
- **Stack:** React 19, Vite 8, TypeScript strict, TanStack Router/Query/Table/Virtual, Zustand, Tailwind CSS 4 with the shared `@crm/ui` components, Zod + React Hook Form (`@hookform/resolvers`), Tiptap, i18next, MSW, Vitest, Playwright.
- **Backend:** Go BFF. Contract: `packages/api-client/openapi/openapi.yaml` (provisional); types and client are generated from it. Which endpoints can be trusted is tracked in [docs/contract-status.md](docs/contract-status.md).
- **Domain status:** the skeleton uses a generic model (4 statuses, queues l1/l2/escalated, 4 roles). Record type `CS`, taxonomy, tiers, and data scope are not applied yet. Treat it as a pattern example.
- **Terms:** "CS agent" (Indonesian: agen CS) is the customer-service staff member who uses the console; "AI agent" is a coding assistant reading this file. The app is named for the console, not for the CS agent.
- **Glossary:** STT = shipment tracking number (Surat Tanda Terima) · Case = CS ticket (status, priority, queue, owner per tier) · Escalation tiers L1 (Frontline) -> L2 (Backline) -> L3; SWAT, Investigator, 3LC · DEX = Delivery Exception · RTS = Return to Sender · COD = Cash on Delivery · POD = Proof of Delivery · PII = phone, address, email, bank account, national ID; always masked by the server/BFF according to permission.

## Verify (definition of done)

| Command                            | When                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm check`                       | Must be green before you finish; same as CI: format check, lint, typecheck, tests + coverage floor, build, size, OpenAPI drift (`codegen:check` diffs against the index: stage regenerated files first)                                                                                                                                                                                    |
| `pnpm exec vitest run <test-file>` | Fast loop on one unit                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm lint` / `pnpm typecheck`     | Fast loop for types and layer boundaries                                                                                                                                                                                                                                                                                                                                                   |
| `pnpm test:e2e`                    | Flow, routing, auth, or UI changes. Runs the console's own tests (`apps/crm-console/e2e`, no remote) and the CS journeys (`examples/e2e/cs`, console plus `examples/crm-cs`). Includes the axe accessibility scan (WCAG 2.1 AA). Needs the browser once: `pnpm --filter @crm/crm-console exec playwright install chromium` (add `--with-deps` on a fresh Linux/WSL machine; it needs sudo) |
| `pnpm test:e2e:mfe`                | Journeys across every menu on the console plus the four examples (`examples/e2e/mfe/`). Not part of CI; it starts or reuses five dev servers                                                                                                                                                                                                                                               |
| `pnpm format`                      | Fixes formatting; CI runs `pnpm format:check`                                                                                                                                                                                                                                                                                                                                              |
| `pnpm codegen:api`                 | After editing `openapi.yaml`; CI fails if the result differs from what is committed                                                                                                                                                                                                                                                                                                        |

## Repo map

```text
apps/crm-console/src   # the shell
  routes/            # file-based routing: login, the authenticated layout, remote page routes
  app/               # layout/AppShell, auth/, modules/registry + remote loader
  lib/               # shell-only helpers (+ *.test.ts)
  mocks/             # MSW worker, mock session and sign-out (dev only, not in the prod bundle); no domain data
  modules/types.ts   # ModuleDefinition contract
apps/crm-console/e2e # the shell's own e2e (no remote)
examples/crm-cs/src    # example remote: customer service
  modules/<id>/      # case, customer: module.ts (RemoteModule), public.ts, api/ queries/ schemas/ components/ pages/ store/
  routes.ts          # code-based routes added under the shell's /_authenticated layout
  module.tsx         # what the remote exposes: its modules
examples/mock-backend # dev mock of the example domain: cases, customers, refunds (MSW handlers, db, masking)
examples/e2e         # journeys across the console and the examples
packages/
  ui/  api-client/  auth/  i18n/  app-kit/  module-contract/  test-utils/  config-ts/  config-eslint/
```

| To add...        | Put it in...                                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRM module       | Copy the `customer` module in `examples/crm-cs/src/modules/` and add its routes to `examples/crm-cs/src/routes.ts`. `pnpm new:module` only makes a module in the shell (none today) |
| Remote app       | `pnpm new:remote <id> --icon <LucideIcon> --permission <module.action>` (new `apps/crm-<id>`, see recipe "Add a remote")                                                            |
| Page / URL       | route in `examples/crm-cs/src/routes.ts`; page body in `src/modules/<id>/pages/`                                                                                                    |
| Module component | `examples/crm-cs/src/modules/<id>/components/`                                                                                                                                      |
| UI component     | `packages/ui/src/` (export it, test it, add it to the gallery)                                                                                                                      |
| API endpoint     | GET: `pnpm new:endpoint`; otherwise `openapi.yaml`, `pnpm codegen:api`, method in `packages/api-client/src/index.ts`, facade `modules/<id>/api/`                                    |
| Permission       | `packages/auth/src/roles.ts`                                                                                                                                                        |
| UI text          | `packages/i18n/src/resources.ts` (both locales)                                                                                                                                     |
| Shared helper    | `packages/app-kit/src/` (api client, env, format, SSE, query keys, `requirePermission`); a remote must not import the shell's `@/lib`                                               |
| Dev mock         | domain data: `examples/mock-backend/src/handlers.ts` (+ `db.ts`; per-role masking in `mask.ts`); session only: `apps/crm-console/src/mocks/`                                        |

### Layer boundaries (enforced by ESLint, `eslint.config.js`)

- In the shell, `lib/` must not import `modules/`, `app/`, or `routes/`; `packages/ui` and `packages/app-kit` must not import any app. A remote imports only packages, never the shell.
- `modules/<m>/` (in either app) must not import `app/`, `routes/`, or another module, except `@/modules/<other>/public` (queries, schemas, store; never components). Cross-module links go through routes (`<Link to="/customers/$customerId">`).
- Inside a module, cross-folder imports use the alias `@/modules/<m>/...`; relative paths must not climb with `../../`.
- `app/` imports only a module's `module.ts` / `public.ts`; modules reach the shell through `app/modules/registry.ts`.
- Used by 3+ modules: move it to `lib/`, `packages/ui`, or another package.

## Rules

**Data and state**

- Server state in TanStack Query; Zustand holds UI state only, never server data.
- Filters and pagination live in the URL (search params + zod, `.catch()` for stale URLs).
- Forms use React Hook Form + a zod schema with i18n-key messages and `FormField`; follow `examples/crm-cs/src/modules/case/components/CaseForm.tsx` (recipe: "Add a form").
- No `fetch` in components and no data fetching in `useEffect`. API calls go through the facade in `modules/<id>/api/`. ESLint rejects `fetch` in `modules/`, `components/`, and `routes/`.
- Master data (status, queue, priority, taxonomy) comes from the API (`GET /v1/master-data` via `useMasterData`: code, label, badge tone). Do not hardcode business enums; URL search and SSE events accept any code.
- A 401 is handled globally (`lib/query-client.ts` + `app/auth/session-expiry.ts`). Do not handle 401 per page.

**Security and PII**

- No tokens in `localStorage`/`sessionStorage`. Session is an `HttpOnly` cookie via the BFF; send `X-CSRF-Token` on non-safe methods.
- Real masking happens on the server/BFF. The mock (`examples/mock-backend/src/mask.ts`) imitates it, and the UI still calls `maskPhone`/`maskEmail`/`maskAddress` as a second layer.
- Permissions via `can()` / `<Can>` and `requirePermission` (from `@crm/app-kit`) on routes. Never `role === '...'` in components.
- No real PII, secrets, or tokens in code, fixtures, logs, or commit messages. Every `VITE_*` variable is public.

**UI**

- Tailwind only, no CSS-in-JS; use `cn` from `@crm/ui`.
- Build screens from `@crm/ui`. A raw `button`/`input`/`select`/`textarea`/table element, or a Tailwind palette color or hex value in a class string, is a lint error: use the component or a design token (see [docs/ui-standards.md](docs/ui-standards.md)).
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
| `apps/crm-console/src/routeTree.gen.ts`          | Generated by the router plugin during `pnpm dev`/build |
| `packages/api-client/src/generated/openapi.d.ts` | `pnpm codegen:api`                                     |
| `apps/crm-console/public/mockServiceWorker.js`   | Generated by MSW                                       |
| `pnpm-lock.yaml`                                 | `pnpm add` / `remove` / `install`                      |

## Known pitfalls

- **The mock session lives in page memory.** In e2e, import `test` from `apps/crm-console/e2e/support.ts` (shell tests: `signedInPage` starts signed in on `/`) or from `examples/e2e/support.ts` (example journeys: starts on `/cases`); `createSignedInTest` in the first makes one for another landing page. The fixture signs in on the mock backend, `clientNavigate` moves through the router (never `page.goto` after signing in or out), and `endSession` ends the session safely.
- **E2E runs with 2 workers on purpose** (`apps/crm-console/playwright.config.ts`). Each worker is a Chromium; 2-4 workers take the same ~25 s, but 6 fail every run and 3 time out when RAM/swap is tight (seen on an 8 GB machine). Do not raise it without re-measuring. If e2e fails only when the machine is swapping, free memory before suspecting the code.
- **i18n `resources` use `as const`**, so TypeScript cannot see a key missing in one locale; the parity test catches it.
- **Mocks run only in dev** (`import.meta.env.DEV`). Production builds exclude MSW, and the image drops `*.map` and `mockServiceWorker.js`.
- **Session expiry vs logout:** `ModuleDefinition.onSignOut(reason)` receives `'logout'` or `'expired'`. Unsent drafts are deleted only on `logout`.
- **Mock role in dev:** the mock session starts as `VITE_MOCK_ROLE`; `?role=l1|l2|supervisor|admin` on the URL overrides it for that page load (dev only, `src/mocks/browser.ts`). Mock data lives in page memory, so a reload resets it.

- **The shell builds its router after the remotes load.** Remote routes (`/cases`, `/customers`) are not in `routeTree.gen.ts`, so `<Link to="/cases">` is not type-checked in the shell; a remote types its search params itself (`examples/crm-cs/src/lib/search-route.ts`). A remote that fails to load leaves its routes out and the shell starts without them.
- **One Tailwind sheet.** The shell scans every app and example `src/` (`@source` in `apps/crm-console/src/styles.css`). A new class in a remote needs a new shell build; a separate Tailwind build in the remote breaks the utility order.
- **Domain mock data lives in `examples/mock-backend`**, loaded into the shell's MSW worker through the `@crm/mock-domain` alias. `MOCK_DOMAIN=examples/mock-backend/src/index.ts` turns it on (`pnpm dev:examples` and the example e2e set it); without it the shell has no domain data. **Texts and permissions of the CS example still live in `@crm/i18n` and `@crm/auth`.** Known coupling, not a rule.
- **Dev:** `pnpm dev` starts the shell alone (it shows the empty state). `pnpm dev:examples` starts the shell (5173) and the four examples (5174 to 5177) together.

## Agent boundaries

- **Git:** no `git add`, `commit`, `push`, or opening a PR without an explicit instruction. Read-only (`status`, `diff`, `log`) is fine. Commits use Conventional Commits (`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`); the `.husky/commit-msg` hook rejects other subjects.
- **Sensitive files:** never print `.env*` with `cat`/`head`/`tail`/`echo`; use the file-read tool.
- **Dependencies:** do not add a package for a few lines of code. If one is needed, pin the exact version and explain why.
- **CI, Docker, nginx, security headers, lockfile:** change only when the task is about them.
- **Scope:** frontend in this repo only. Anything that depends on the backend/BFF is recorded as an assumption on the provisional contract, not implemented.
- **Replies:** short and direct; no praise or validation.

## Git, PRs, environment

Branches: `feature/`, `bugfix/`, `hotfix/`, `release/`; flow `development` -> `staging` -> `master`. Open PRs against `development`. A PR needs a green `pnpm check`, a "why", and screenshots for UI changes. CI runs `format:check`, `pnpm check`, the OpenAPI drift check, e2e (+ axe), and an image build (`nginx -t`, no `*.map`/`mockServiceWorker.js`). Environment variables are listed in `apps/crm-console/.env.example` (copy it to `.env.local`); Docker takes `VITE_API_BASE_URL`, `VITE_TELEMETRY_URL`, and `VITE_REMOTE_MODULES` (default empty: the image is the shell alone) as build args.

## Keep the docs true

Record decisions that are costly to reverse as ADRs in `docs/adr/` (when to write one, and the template, are in `docs/adr/README.md`). Do not rewrite an accepted ADR; supersede it with a new one.

When structure, commands, or rules change, update `README.md` and this file. `apps/crm-console/scripts/agent-docs.test.mjs` fails when a repo path mentioned in the docs no longer exists, or when an operation in `openapi.yaml` is missing from `docs/contract-status.md` or has an unknown status. When the API contract changes, update `openapi.yaml`, run `pnpm codegen:api`, update the mock, and update `docs/contract-status.md`.

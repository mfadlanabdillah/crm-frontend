# Agent recipes

Step-by-step procedures per task type. Rules and boundaries live in [AGENTS.md](../../AGENTS.md).
Each recipe ends with **Done when**; run that command and report the result as it is.

Living references: module `case` (`examples/crm-cs/src/modules/case/`) and `customer`. Domain modules live in the CS remote (`examples/crm-cs`); the console is only the shell.

## Add an API endpoint

For a GET with path parameters, run `pnpm new:endpoint <module> <operationId> --path /v1/<segments>[/{param}] [--permission <module.action>]` (`apps/crm-console/scripts/new-endpoint.mjs`). It does steps 1 to 5 and 8 with placeholders and adds a mock stub that answers 501. You then fill in the response schema (step 1, re-run `pnpm codegen:api`), the mock body and PII masking (step 6), the `enabled` gate (step 7), and the tests (step 9). For other methods or query filters, follow the steps by hand.

1. Add the path and schema to `packages/api-client/openapi/openapi.yaml`. Business codes (status, queue, priority) are plain `string`; their values come from master data, not an OpenAPI enum.
2. Run `pnpm codegen:api` (it writes `packages/api-client/src/generated/openapi.d.ts`; never edit that file).
3. Export the type and add a method to `createApiClient` in `packages/api-client/src/index.ts`, wrapped in `unwrap(...)` like the others so errors become `ApiError`.
4. Wrap it in the module facade `examples/crm-cs/src/modules/<id>/api/<id>.ts`. Components never call `api` directly.
5. Add a query hook in `modules/<id>/queries/` using `queryOptions` and the module's own key factory in `modules/<id>/queries/keys.ts` (`caseKeys`, `customerKeys`; `src/lib/query-keys.ts` holds only cross-module keys such as `sessionKey` and `masterDataKey`). Example: `useMasterData.ts`.
6. Dev mock: data in `examples/mock-backend/src/db.ts`, handler in `examples/mock-backend/src/handlers.ts`. Mask PII per role through `examples/mock-backend/src/mask.ts`. If only some roles may call the endpoint, enforce it in the handler with `can(role, 'x')` and answer 403, like the existing handlers.
7. If only some roles may call it, do not fire the request for the others: gate the query with `enabled` (`useQuery({ ...options, enabled: can('x') })`, with `can` from `useAuth()`), otherwise they trigger a 403 on every visit.
8. Add a row to `docs/contract-status.md` (a new endpoint starts as **Proposed**). A test fails when an operation in `openapi.yaml` is missing from that table.
9. Tests: client logic in `packages/api-client/src/index.test.ts`; components that use it with `renderWithProviders` from `@crm/test-utils` (seed the cache with `queryClient.setQueryData`).

**Done when:** `pnpm codegen:api` leaves no uncommitted diff and `pnpm check` is green.

## Add a CRM module

1. Copy `examples/crm-cs/src/modules/customer/` to `modules/<id>/` and rename it, then add the module to `examples/crm-cs/src/module.tsx` and its routes to `examples/crm-cs/src/routes.ts` (with `requirePermission`). `pnpm new:module` only generates a module inside the shell (`apps/crm-console`), which has none today. For a new team's own app, see "Add a remote".
   After the copy, these edits are easy to miss (tried on a copy of `customer`):
   - inside the copied files, `@/modules/customer/...` imports must become `@/modules/<id>/...`; otherwise ESLint reports a cross-module import;
   - the route ids in the pages (`searchRoute('/_authenticated/customers')`, `getRouteApi('/_authenticated/customers/$customerId')`) and the `<Link to="/customers/...">` targets must match the paths you add in `routes.ts`;
   - `routes.ts` already imports components with the same names, so import the copies with an alias (`import { CustomerListPage as PartnerListPage } ...`);
   - the module needs its own `id`, `labelKey`, `basePath`, and `nav` in `module.ts`.
2. Add the permission in `packages/auth/src/roles.ts` (the `Permission` type and the per-role lists).
3. Add `<id>.title` and any other text to both locales in the remote's `src/texts.ts`, and call `registerTexts()` when the module loads (as `examples/crm-cs/src/module.tsx` does).
4. Contract, facade, query, and mock: follow "Add an API endpoint".
5. Expose things to other modules only through `modules/<id>/public.ts` (queries, schemas, store; never components).
6. Put the markup in components with their own tests, as in "Add a page or route"; otherwise the coverage floor fails.

**Done when:** `pnpm check` is green and `pnpm test:e2e` passes (the module shows in navigation for roles that may see it).

## Add a remote

For a new domain that a separate team releases on its own: `pnpm new:remote <id> [--icon <LucideIcon>] [--permission <module.action>] [--port <n>]` (`apps/crm-console/scripts/new-remote.mjs`). It creates `apps/crm-<id>` with a federation config, one page under `/remote/<id>`, and its own text namespace, and takes the next free dev port.

1. Add the permission in `packages/auth/src/roles.ts` if it is new.
2. Run `pnpm --filter @crm/crm-<id> dev` and start the console with `VITE_REMOTE_MODULES=crm_<id>=http://localhost:<port>/remoteEntry.js` (a comma separates several remotes).
3. Build the page from `@crm/ui`; use `api` from the page props, not your own client. A remote that needs its own routes adds `routes` to its module, as `examples/crm-cs` does.
4. Production needs the hosting items in [ADR-0009](../adr/0009-micro-frontends.md) (path, CORS, CSP); the generator does not set them up.

**Done when:** the remote's menu shows for the roles that hold the permission, and `pnpm check` is green.

## Add a page or route

1. Page body goes in `modules/<id>/pages/`. The route goes in `examples/crm-cs/src/routes.ts` (code-based, under the shell's `/_authenticated` layout) and holds only `validateSearch`, the guard (`requirePermission` from `@crm/app-kit`), and the page component. Read search params in the page with `searchRoute<S>(id)` from `@/lib/search-route`.
2. Filters and pagination in the URL: a zod schema with `.catch()` for stale values and `stripSearchParams(DEFAULT_...)` to keep URLs short (see `examples/crm-cs/src/modules/case/schemas/search.ts`).
3. `routeTree.gen.ts` (shell only) is regenerated by `pnpm dev`; never edit it. Remote routes are not in it.
4. Pages that pull in a heavy library use `lazy()` + `Suspense`.
5. Keep the page itself thin and put the markup in a presentational component under `modules/<id>/components/` (props in, JSX out). Pages are covered only by e2e, but they count toward the coverage floor, so `pnpm check` goes red when a feature adds UI with no unit test. Test the component; if it contains a `Link`, use `renderWithRouter` (see "Write tests").

**Done when:** `pnpm check` is green and `pnpm size` shows the new route under 300 KB gzip.

## Add a form

Reference: `examples/crm-cs/src/modules/case/components/CaseForm.tsx` (used by `pages/CaseCreatePage.tsx`).

1. Put the zod schema in `modules/<id>/schemas/`. Messages are **i18n keys** (`.min(3, 'cases.create.errors.subjectShort')`), added to both locales. Selects whose values are business codes start empty and are required; options come from master data, never from a hardcoded list.
2. Build the form with `useForm({ resolver: zodResolver(schema), defaultValues })` from `react-hook-form` and `@hookform/resolvers/zod`. The form component is presentational: it receives `onSubmit(request)`, `onCancel`, `isPending`, and a server `error` string, and emits a ready-to-send request (see `toCreateCaseRequest`).
3. Render each field with `FormField` (`packages/ui/src/form-field.tsx`): it wires the label, hint, and error to the control through `id`, `aria-describedby`, and `aria-invalid`. Spread its render-prop argument and then `register('name')` onto the control: `{(control) => <Input {...control} {...register('subject')} />}`. Show errors with `t(errors.field?.message)`.
4. The page owns the mutation (`queries/useCreate<Thing>.ts`: `useMutation` + invalidate list/summary keys) and navigation. A server failure such as a 422 comes back as `ApiError`; pass `mutation.error?.message` to the form's `error` prop.
5. Tests: a schema test (messages are keys), a component test with `userEvent` (translated errors, submit payload, pending state), and an e2e that fills the form. In e2e use `getByLabel(text, { exact: true })` or `getByRole('combobox', { name })`: label matching is a case-insensitive substring and can hit the list page's search box.
6. Add the page to `e2e/a11y.spec.ts`, with and without validation errors showing.

**Done when:** `pnpm check` and `pnpm test:e2e` are green.

## Add or change a UI component

Components and design tokens live in `packages/ui` (`@crm/ui`), see [docs/ui-standards.md](../ui-standards.md) and [ADR-0008](../adr/0008-shared-ui-package.md). Add a component only when a feature needs it ([ADR-0005](../adr/0005-ui-primitives-on-demand.md)): dialog, dropdown, tooltip, and toast are not included until then. First check the component table in the standards: the need may already be covered.

1. Write it in `packages/ui/src/<name>.tsx`: styling and behavior only, design tokens only (no `gray-500`, no hex), no API calls, no feature imports. Extend through `className` and `cn`.
2. Export it from `packages/ui/src/index.ts`.
3. Add `packages/ui/src/<name>.test.tsx`: roles, states, and keyboard where it applies.
4. Add it, in every state, to `apps/crm-console/src/app/design-system/Gallery.tsx`; the axe e2e scans that page.
5. Add a row to the component table in `docs/ui-standards.md`.
6. If you start from the shadcn registry, pin the CLI version and review everything it adds: it brings an unrelated npm package named `cn`, a `radix-ui` range with `^` (pin it), color tokens this theme does not define (`bg-background`, `text-muted-foreground`; map them to `bg-surface`, `text-ink-muted`, ...), and `Button` variants that do not exist (`outline`; ours are `primary`, `secondary`, `ghost`, `danger`). Put the result in `packages/ui/src`.

**Done when:** `pnpm check` and `pnpm test:e2e` are green and `package.json` has no `^` ranges or stray packages.

## Add UI text

1. Add the key in both `id-ID` and `en-US`, in `packages/i18n/src/resources.ts` for the shell or in the remote's `src/texts.ts` for its screens (`examples/crm-cs/src/texts.ts`), with the same structure and `{{...}}` placeholders. Validation messages in zod schemas are keys too, translated at render time.
2. Use `t('key')` from `react-i18next`; no display strings inline in JSX.
3. Status, queue, and priority labels are not i18n text: they come from `GET /v1/master-data`.

**Done when:** `pnpm exec vitest run packages/i18n examples/crm-cs/src/texts.test.ts` is green (locale parity tests).

## Add or change a permission

1. Add the name to the `Permission` type and to the roles that hold it in `packages/auth/src/roles.ts`.
2. UI: `can('x')` or `<Can permission="x">`. Route: `beforeLoad: requirePermission('x')`. Module: `permission: 'x'` in `module.ts` hides its navigation.
3. This only controls the UI; the server stays the final gatekeeper.

**Done when:** `packages/auth/src/roles.test.ts` covers the new permission and `pnpm check` is green.

## Show personal data (PII)

1. The server already masks; the UI still calls `maskPhone`/`maskEmail`/`maskAddress` from `@crm/auth` with the current role.
2. Never write PII to logs, error messages, or test fixtures; use fake data (`example.com`).
3. The server-imitating mock is `examples/mock-backend/src/mask.ts`; update it when a field shape changes.

**Done when:** a masking test covers the new field (`packages/auth/src/pii.test.ts` or `examples/mock-backend/src/mask.test.ts`).

## Errors, expired sessions, and logout

- API errors become `ApiError` (`status`, `code`, `requestId`). Show them with `ErrorState` (`packages/ui/src/data-state.tsx`); the message may come from the server, never show a stack trace.
- A 401 from any query or mutation is handled globally (`lib/query-client.ts` calls the handler installed by `app/auth/session-expiry.ts`): client data is cleared and the app goes to `/login?redirect=...`. Do not add per-page 401 handling.
- A module cleans its state through `onSignOut(reason)` in `module.ts`. `expired` may keep unsent work (example: `examples/crm-cs/src/modules/case/store/drafts.ts`); `logout` must delete it.
- Render errors are caught by `RouteError` (`app/layout/RouteFallbacks.tsx`) and reported through `reportError` in `lib/telemetry.ts`. Plug in an SDK with `setErrorReporter`.

**Done when:** the new behavior has a unit test and, if it changes the session flow, an e2e (`examples/e2e/cs/case-workspace.spec.ts` is the example).

## Write tests

- **Unit/component:** `*.test.ts(x)` next to the code. For components using queries, use `renderWithProviders` from `@crm/test-utils` and seed the cache with `setQueryData`. For i18n text, `await createI18n()` in `beforeAll`, then the remote's `registerTexts()`.
- **Router:** components that render a `Link`, use `useNavigate`, or show route errors: `await renderWithRouter(<Thing />, { linkTargets: ['/cases/$caseId'] })` from `@crm/test-utils` (memory router + query client; `rootOptions` passes `errorComponent` and friends). Example: `app/layout/RouteFallbacks.test.tsx`.
- **E2E (Playwright):** dev server with MSW. The shell's own tests are in `apps/crm-console/e2e/` (no remote); journeys through a remote are in `examples/e2e/`. Import `test` and `expect` from the `support.ts` next to them and take `signedInPage` (already signed in: on `/` for the shell, on `/cases` for the CS example). Move with `clientNavigate`, never `page.goto`, after signing in or out; end the session with `endSession`.
- **Accessibility:** add new pages to `e2e/a11y.spec.ts`; `expectNoViolations` must stay clean.
- The coverage floor is in `vitest.config.ts`; raise it when tests grow.

**Done when:** `pnpm check` and, for UI/flow changes, `pnpm test:e2e` are green.

## Change dependencies, CI, or Docker

Only when asked. Pin exact versions (`.npmrc` already has `save-exact`), prefer releases older than two weeks, and explain why. After editing `package.json`, run `pnpm install` and commit `pnpm-lock.yaml`. For the image: `docker build -t crm-console .`, then `docker run --rm crm-console nginx -t` must succeed.

**Done when:** `pnpm install --frozen-lockfile` and `pnpm check` are green.

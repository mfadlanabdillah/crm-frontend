# ADR-0009: The console is a shell; every domain, including customer service, is a remote

- Status: Proposed
- Date: 2026-10-29

## Context

The CRM will serve several teams (customer service now, later Finance, Investigator, and others). The
engineering lead asked whether the frontend can be built as micro frontends. A proof of concept
([docs/poc/micro-frontend.md](../poc/micro-frontend.md)) used the console as the host and loaded three
remotes (Finance, Investigator, Monitor) at runtime with Module Federation (`@module-federation/vite`,
Vite 8). The team then decided that `apps/crm-console` should be a reusable boilerplate, so customer
service (the Case and Customer modules) was moved out of the console into its own remote,
`apps/crm-cs`. All data is mock. What the work showed:

- **It works.** A remote is built and served on its own, appears in the menu through the module
  contract, and shares one React, one session, one query cache, and one i18n instance with the shell.
  Menus and routes are guarded by permission per role, and a remote uses the shell's API client (same
  session, CSRF handling, masking).
- **A remote can own real routes.** The CS remote adds `/cases` and `/customers` as code-based routes
  under the shell's authenticated layout. This needs `@tanstack/react-router` as a shared singleton and
  the router to be created after the remotes load. Deep links survive a hard reload, route guards get
  the session context, and `Link`/`useRouter` in the remote use the shell's router. All 21 e2e specs of
  the console pass unchanged against the shell plus the CS remote, and the 14 cross-menu specs pass.
- **Failures stay contained, but the shell is not usable without CS.** Stop a remote and the shell and
  the other remotes keep working. If the CS remote is down, a CS agent gets an empty state, because the
  product's main screens are gone. The CS remote is on the critical path.
- **The shell got smaller, not free.** Initial JavaScript is 201.7 KB gzip, against 175.1 KB for the
  console before the proof of concept and 204.7 KB with it (the federation runtime and the shared
  libraries; budget 300 KB).
- **It has costs that do not go away.**
  - **Routing types.** Remote routes are not in the shell's generated route tree, so links to `/cases`
    and `/customers` are not type-checked in the shell, and the remote types its own search params
    (`apps/crm-cs/src/lib/search-route.ts`).
  - **One shared Tailwind sheet.** The shell's build scans the remote's source. A second Tailwind build
    in the remote broke the utility order (a late `.hidden` beat the shell's `lg:flex`). A new class in
    the remote needs a new shell build, so independence covers logic and data, not appearance.
  - **Shared code moves to packages.** A remote cannot import the shell, so the helpers both need moved
    to a new package, `@crm/app-kit`, and the permission guard moved with them.
  - **Coupling that stays.** CS mocks, CS texts (`@crm/i18n`), and CS permissions (`@crm/auth`) still
    live in the shell and shared packages. `pnpm new:module` only creates shell modules;
    `pnpm new:remote` creates a whole remote app, but a new module inside `apps/crm-cs` is still
    copied by hand.
  - **No isolation.** A remote runs in the same page with the same cache, which holds customer data,
    and can call the API with the user's session. Splitting a team into a remote adds no data
    protection; the BFF and server-side permissions remain the only boundary.
  - **Production is built, not run.** The image now serves the CS remote under `/cs/` and the shell is
    built with `VITE_REMOTE_MODULES=crm_cs=/cs/remoteEntry.js`. This was built but not run behind
    nginx. HTTPS and CORS for separate remote origins, the CSP (`script-src 'self'`), a deploy pipeline
    per remote, and coordination of the shared singletons are not designed.

## Decision

Proposed:

1. **The console is a shell.** It owns login, session, layout, navigation, the router, and the remote
   loader. It ships no domain screens and starts with an empty state when no remote loads.
2. **Every domain is a remote**, customer service included. Today that is `apps/crm-cs`; Finance,
   Investigator, and Monitor stay proof-of-concept remotes until their teams exist.
3. **A remote imports packages, never the shell.** What shell and remotes share lives in
   `@crm/app-kit`, `@crm/ui`, `@crm/auth`, `@crm/api-client`, and `@crm/module-contract`. ESLint enforces
   module boundaries inside every app.
4. **Remotes are shared by name only.** `react`, `react-dom`, `react-i18next`,
   `@tanstack/react-query`, `@tanstack/react-router`, `@crm/app-kit`, `@crm/auth`, and `@crm/ui` are
   singletons. Someone owns that list and the contract package.
5. **Before production use**, design the items under "Production is built, not run", agree the BFF and
   SSO contract, and decide how a CS remote outage is handled (the shell's empty state is not enough).
6. **Never present a remote as a data boundary.**

## Consequences

- The shell can be reused for another product by registering other remotes. A new team starts from a
  module copied from `apps/crm-cs` and can release its logic and data on its own.
- CS agents depend on two builds and two deploys instead of one. CI starts the CS remote for e2e; the
  image builds both apps.
- Type safety for cross-app links is weaker, and shell and remote builds are coupled through Tailwind.
- The proof of concept is no longer a branch to rebase later: it is the product's structure. If the
  costs above outweigh the benefit once real teams exist, collapsing `apps/crm-cs` back into the
  console is a mechanical move (the modules keep their boundaries), so the decision is reversible.

## Alternatives considered

- **One app, every domain inside the console (a modular monolith).** Cheapest: one build, one deploy,
  typed routes, no federation. This was the earlier recommendation of this ADR (the console held Case
  and Customer). It stops being enough once a team must release on its own schedule or the console must
  serve as a boilerplate for other products.
- **Shell plus remotes, but customer service stays in the shell.** Keeps the main product on the
  simplest path and gives other teams independence. It leaves the shell carrying one team's code, so it
  is not a boilerplate.
- **Several apps in the monorepo that share packages, without runtime loading.** Separate deployments
  and a stronger boundary, but no single UI; fits separate products better than one console.
- **Build-time composition.** One codebase and a per-team build; it releases together, so it is not
  independence.
- **Iframes.** The strongest isolation, but poor navigation, session, and accessibility behavior.

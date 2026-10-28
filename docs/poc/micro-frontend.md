# Micro frontend PoC

Status: proof of concept on a feature branch. It answers "can this app be split into micro
frontends?" with a working host and one remote. It is not an accepted architecture decision; if the
team adopts it, record that as an ADR (`docs/adr/README.md`).

![Finance module loaded into the host](../images/mfe-finance.png)

## What it proves

| Claim                                                                     | Evidence                                                                                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A separate app can plug a module into the console at runtime              | `apps/crm-finance` is built and served on its own; the host loads its `remoteEntry.js` in the browser                                            |
| The remote appears in the navigation through the existing module contract | The remote's default export is a `ModuleDefinition` (id, label key, icon, path)                                                                  |
| One React, one session, one `QueryClient`, one i18n instance              | The remote page shows the signed-in user and role, the shared query cache, the host's language, and uses hooks; it downloads no React of its own |
| The remote ships on its own                                               | Change the remote, rebuild only `apps/crm-finance`, reload the host: the change shows, the host is untouched                                     |
| The host survives a remote that is down                                   | Stop the remote and reload: Case and Customer work, Finance disappears from the menu, `/remote/finance` shows "Modul tidak tersedia"             |

## How it works

```text
apps/crm-console        host: shell, session, routing, shared singletons
  vite.config.ts        federation plugin, no remote listed (the build does not need one)
  src/app/modules/remote.ts          reads VITE_REMOTE_MODULES, registers remotes, loads `<name>/module`
  src/app/modules/registry.ts        registerRemoteModule(); built-in modules are untouched
  src/app/modules/RemoteModulePage.tsx   renders a remote module's Page, or an "unavailable" state
  src/routes/_authenticated/remote/$moduleId.tsx   one generic route for every remote module
apps/crm-finance      remote: exposes ./module (a ModuleDefinition with a Page)
  vite.config.ts        federation plugin: name, exposes, shared singletons
  src/module.tsx        adds its own texts to the host's i18n, exports the module definition
  src/FinancePage.tsx   page that reads the shared auth, query cache, and i18n
```

- **Tool:** `@module-federation/vite` 1.23.5 (Vite 8 is in its peer range) and
  `@module-federation/runtime` 2.9.2 in the host, both pinned.
- **Runtime registration:** the host does not know the remote at build time. Its URL comes from
  `VITE_REMOTE_MODULES` (`name=entryUrl`, comma separated; empty means no remotes), so the same host
  build can point to different remotes per environment.
- **Shared singletons** (`react`, `react-dom`, `react-i18next`, `@tanstack/react-query`,
  `@crm/auth`): both apps declare them in the federation config. Anything that holds state or
  context must be shared, or hooks break and contexts split.
- **Styling:** the remote has no Tailwind build. Its plain CSS reads the host's design tokens
  (`--color-ink`, `--color-brand`, ...), so the look stays consistent without duplicating styles.
- **Failure handling:** loading has a 5 second timeout and any failure is logged with
  `console.error`; the host starts without that remote.

## Run it

```bash
pnpm install
pnpm poc:mfe          # remote on :5174, host on :5173 (mock backend, signed in as supervisor)
```

Open http://localhost:5173 and click **Finance** in the sidebar. To see the host without the
remote, run `pnpm dev` (no `VITE_REMOTE_MODULES`). To load a production build of the remote:

```bash
pnpm --filter @crm/crm-finance build
pnpm --filter @crm/crm-finance preview        # serves dist on :4175
VITE_REMOTE_MODULES=crm_finance=http://localhost:4175/remoteEntry.js pnpm dev
```

`poc:mfe` sets the variable inline, which works in bash and zsh (Linux, macOS, WSL). It uses
`--no-bail`, so stopping the remote does not stop the host.

## Add another remote

`apps/crm-finance` is the boilerplate. For a new remote (say `billing`):

1. Copy `apps/crm-finance` to `apps/crm-billing`. In `package.json` change the package name; in
   `vite.config.ts` change the federation `name` (a unique JavaScript identifier, for example
   `crm_billing`) and both ports.
2. In `src/module.tsx` change the module `id`, the i18n texts, `basePath` (`/remote/billing`), and
   `nav.params.moduleId`. Module ids must be unique across the host and every remote.
3. Keep the `shared` list identical to the host's `vite.config.ts`; add a library there only in
   both apps at once.
4. Run `pnpm install`, then list the remote for the host:
   `VITE_REMOTE_MODULES=crm_finance=http://localhost:5174/remoteEntry.js,crm_billing=http://localhost:5176/remoteEntry.js`.
5. Add the app to the `poc:mfe` filters in the root `package.json` if it should start with the rest.

A remote must not import host code (`@/...`); everything it shares comes from the singletons.

## What it does not cover

- **Production hosting.** A production host build has no mock backend, so signing in needs the real
  BFF. The remote must be served over HTTPS with CORS allowing the host origin, and the CSP in
  `security-headers.inc` (`script-src 'self'`) must allow the remote's origin. CI, Docker, and
  nginx are not changed in this PoC.
- **Versioning.** Host and remote share singletons by name only. A breaking change in a shared
  library (for example React) needs a coordinated release; nothing here enforces it.
- **Contract type.** `apps/crm-finance/src/module.tsx` repeats the shape of `ModuleDefinition`
  (`apps/crm-console/src/modules/types.ts`) because that file imports host code. Before a second
  remote exists, move the contract to a shared package.
- **Routing inside a remote.** A remote gets one page behind `/remote/<id>`. Nested remote routes
  would need a splat route that mounts the remote's own router; TanStack's file-based routes are
  static, which is the hardest part of going further.
- **Shared UI.** `components/ui` still lives inside `apps/crm-console`, so the remote cannot reuse the
  primitives. Extract them to a package first.
- **Domain.** The remote page reads no API and invents no Finance data, permission, or contract.
- **Tests across apps.** Unit tests cover the loader, the registry, and the fallback page. There is
  no end-to-end test that starts both apps; CI never runs the remote and stays green without it.

## Security: a remote is not isolated from the host

A loaded remote runs in the same page as the console, with the same React, session, and
`QueryClient` cache. That is what the PoC page demonstrates on purpose, and it has a consequence:

- Remote code can read anything in the shared cache, including customer data (phone, email,
  address), and can call the API with the signed-in user's session.
- Splitting Finance into a remote therefore **adds no data protection**. What limits access is still
  the permission checks and PII masking on the server/BFF, as `AGENTS.md` requires.
- A remote's code runs in every user's browser, so only load remotes from teams and servers that
  are fully trusted, and keep the allowed origins in the CSP and CORS configuration.
- If Finance data must be isolated from the CS console, that needs a genuinely separate app and
  domain (no shared page, session scope, or cache), not a micro frontend.

## Cost to weigh

Every point under "What it does not cover" is work a plain modular monolith does not have. The
module boundaries and per-role navigation that already exist deliver most of the benefit while one
team owns the console. Independent deployment, the thing only a micro frontend gives, pays off when
separate teams need to release on their own schedules.

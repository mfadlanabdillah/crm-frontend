# Production readiness notes

Status: **draft for the team to complete.** This is a checklist of what has to be decided or built before
the shell and its remotes run in production. It records what the repository does today (facts, with the
file to check) and what is still open. Nothing here is a decision yet: the `Owner`, `Decision`, and
`Status` columns are for the team to fill in.

How to use it: work from the top. Items marked **Blocker** must be closed before the first production
release; **Next** items follow; **Later** items depend on a second team or real traffic. When an item is
decided, record it in the "Decision log" at the end and, if it is costly to reverse, write an ADR
(`docs/adr/README.md`).

## Assumptions (correct these first)

These shape many answers below. They are guesses, not facts.

- The target platform is **not known**: Kubernetes, ECS, or a static bucket with a CDN all change how
  config, rollback, and caching are done. **Open: which one?**
- The shell and the remotes are served **from the same origin** (the image serves the shell; a remote is
  a path next to it). A remote on another origin changes CORS and CSP.
- The BFF (Go) and SSO exist before go-live and share an origin with the frontend. Today everything runs on
  the MSW mock.
- One team owns the shell and the first remote; a second team does not exist yet.

## Where things stand today

| Area             | Fact (where to check)                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image            | `Dockerfile`: builds the shell only, nginx on port 8080, non-root, healthcheck. No remote inside by default                                                                         |
| Remotes          | Listed in `VITE_REMOTE_MODULES` (`name=url` pairs), **baked in at build time**                                                                                                      |
| Caching          | `nginx.conf`: hashed assets `immutable`; everything else `no-cache` (so `remoteEntry.js` is always fresh)                                                                           |
| Security headers | `security-headers.inc`: HSTS, nosniff, referrer policy, enforced `frame-ancestors 'none'` and `X-Frame-Options: DENY`; the rest of the CSP is **Report-Only** (`script-src 'self'`) |
| CI               | `.github/workflows/ci.yml`: `pnpm check`, e2e, image build. **No deploy, no registry push, no smoke test**                                                                          |
| Branches         | `development` → `staging` → `master`; CI runs on pull requests to those                                                                                                             |
| Errors           | `setErrorReporter` hook in `apps/crm-console/src/lib/telemetry.ts`; **no SDK connected**                                                                                            |
| Source maps      | Built (`sourcemap: 'hidden'` in `apps/crm-console/vite.config.ts`), **deleted from the image**; no upload step                                                                      |
| Shared libs      | Singletons share by name with `requiredVersion: false`: **no version check** between shell and remote                                                                               |
| Bundle budget    | `pnpm size`: initial JS and each route ≤ 300 KB gzip (the shell is about 200 KB)                                                                                                    |
| Dependencies     | `renovate.json` exists                                                                                                                                                              |

## Checklist

| #   | Area                         | What to prepare                                                                                                                                   | State today                                                                                                                                                   | Priority | Owner | Status |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----- | ------ |
| 1   | Runtime config               | Build once, deploy to every environment: read the API base URL, the telemetry URL, and the remote list from a `config.json` served at runtime     | All `VITE_*` values are baked in, so staging and production are two different builds                                                                          | Blocker  |       |        |
| 2   | Release and rollback         | Keep the previous N versions of hashed assets so tabs opened before a deploy do not get 404s; define how to roll back the shell and a remote      | Old assets are not kept; no rollback procedure                                                                                                                | Blocker  |       |        |
| 3   | 404 caching in nginx         | A missing file under `/assets/` must not be cached as `immutable`                                                                                 | `location ~ ^/([a-z0-9-]+/)?assets/` adds `immutable` to 404 responses too                                                                                    | Blocker  |       |        |
| 4   | Chunk load failures          | After a deploy, a failed dynamic import should say that a new version is out and reload once, instead of a generic error                          | The generic error screen ("Terjadi kesalahan") has "Coba lagi" and "Muat ulang halaman" buttons, but no message about a new version and no automatic reload   | Blocker  |       |        |
| 5   | Error reporting              | Connect an SDK through `setErrorReporter`; also report remote load failures (today only a banner and `console.error`)                             | Hook exists, nothing connected                                                                                                                                | Blocker  |       |        |
| 6   | Source maps                  | Upload maps to the error tracker at deploy, keep them out of the public image                                                                     | Maps are deleted; nothing uploads them                                                                                                                        | Blocker  |       |        |
| 7   | BFF and SSO                  | Agree the contract and cookie settings; add contract tests or a staging environment with the real BFF                                             | Contract is provisional (`docs/contract-status.md`); all tests use the mock                                                                                   | Blocker  |       |        |
| 8   | CSP                          | Run Report-Only for one cycle in staging, read the reports, then enforce. Revisit `script-src` and `connect-src` if a remote is on another origin | Report-Only                                                                                                                                                   | Blocker  |       |        |
| 9   | Smoke test after deploy      | Check that `remoteEntry.js` of each configured remote returns 200 and that the shell shows the menu for a test account                            | None                                                                                                                                                          | Blocker  |       |        |
| 10  | Environments and promotion   | Define dev, staging, production; how an image is promoted; who approves                                                                           | Branch flow exists, no deploy jobs                                                                                                                            | Next     |       |        |
| 11  | Shared library versions      | A policy so a remote built against another React or `@crm/ui` is rejected or flagged, or a rule that everything ships with one lockfile           | `requiredVersion: false`: any version loads and may break at runtime                                                                                          | Next     |       |        |
| 12  | Remote hosting and pipeline  | Where a remote is served (path or origin), how it is built and published on its own, how the shell learns its URL                                 | Remotes are only built by `pnpm build:examples`; the shell image holds none                                                                                   | Next     |       |        |
| 13  | Remote down                  | Decide what users see and what operations does when a remote is unreachable (the shell shows a banner and an empty state today)                   | Banner with a reload button (`RemoteLoadAlert`); no alerting                                                                                                  | Next     |       |        |
| 14  | Observability                | Web Vitals, error rate, remote load time and failure rate, per release                                                                            | `web-vitals` is in the shell; no destination, no remote metrics                                                                                               | Next     |       |        |
| 15  | Access to remote artifacts   | A remote runs in the same page as the user's session: limit who can publish one, and sign or hash artifacts if they come from another origin      | Not designed                                                                                                                                                  | Next     |       |        |
| 16  | Tailwind and remote releases | A new class in a remote needs a new shell build because the shell builds the only stylesheet; decide whether to accept it or change the approach  | Documented limit (`examples/README.md`)                                                                                                                       | Next     |       |        |
| 17  | Dependency updates           | Review cadence for Renovate PRs; pinned versions and `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`                                          | Renovate configured                                                                                                                                           | Later    |       |        |
| 18  | Per-remote ownership         | CODEOWNERS or equivalent per remote; who may change the contract package and the shared singleton list                                            | None                                                                                                                                                          | Later    |       |        |
| 19  | Capacity and performance     | Load targets, CDN, and compression; extend the bundle budget to remotes                                                                           | Budget checks the shell only                                                                                                                                  | Later    |       |        |
| 20  | Accessibility gate           | Keep the axe scan green for every remote screen in CI                                                                                             | The CS journeys run in CI; the other examples' scans run only in `pnpm test:e2e:mfe`                                                                          | Later    |       |        |
| 21  | API paths in nginx           | Unknown `/v1/` paths must answer 404 (or be proxied to the BFF), not the SPA's `index.html`                                                       | `try_files ... /index.html` also serves `/v1/session` when no BFF is behind it, so the shell fails on an HTML parse error (seen when running the image alone) | Blocker  |       |        |

## Questions only the team can answer

1. Which platform runs the image, and is there a CDN in front?
2. Will a remote ever be served from a different origin than the shell, or always from a path on it?
3. Who deploys, and is a remote deployed together with the shell or on its own?
4. What is the target for time to roll back, and how many old versions are kept?
5. Which error tracker and which log destination are used?
6. Who approves a production release, and what must be green first?
7. Is the 300 KB budget per route the right limit once real remotes exist?

## Decision log

Add a row when an item is decided.

| Date | Item # | Decision | Reason | Decided by |
| ---- | ------ | -------- | ------ | ---------- |
|      |        |          |        |            |

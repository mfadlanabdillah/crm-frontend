# ADR-0004: E2E runs with 2 workers

- Status: Accepted
- Date: 2026-10-27

## Context

Playwright defaults to half the CPU cores (6 on a 12-core machine). Each worker is a Chromium that
loads pages from a Vite dev server. The first full run after clearing the Vite cache failed three tests
at the first page loads. The first explanation (Vite re-bundling and reloading) was wrong: a single
browser against a cold server showed no reload. A first attempt to fix it with 3 workers looked good on
one run and was not.

Repeated measurements on the development machine (12 cores, 7.8 GB RAM, swap nearly full):

| Workers | Result                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------- |
| 6       | Failed 3 of 3 cold runs (5-7 tests each), 1.1-1.6 min                                           |
| 3       | Passed 3 of 3 cold runs on a quiet machine (~31 s); timed out twice when RAM/swap was exhausted |
| 2       | Passed 3 of 3 runs with swap exhausted (~30 s); ~24 s on a quiet machine                        |

Two to four workers take the same time. Warm-up in `globalSetup` and `optimizeDeps.entries` did not help.

## Decision

`workers: 2` in `apps/crm-agent/playwright.config.ts`, with the measurement in a comment.

## Consequences

- E2E stays green when memory is tight, at no cost in time on this suite.
- A machine with plenty of RAM runs slightly below its capacity; raise the number only after
  re-measuring.
- CI keeps `retries: 2`, which can hide flakiness: always read the "flaky" count in the Playwright
  summary. The first CI run reported one flaky test; it was a real race (an in-flight request answered
  401 after logout) and was fixed in `e2e/support.ts`.
- If e2e fails only when the machine is swapping, free memory before suspecting the code.

## Alternatives considered

- **Warm-up before the tests, or `optimizeDeps.entries` for lazy routes.** Tried; no effect.
- **E2E against a production build.** Mocks only run in dev (`import.meta.env.DEV`), so a preview build
  has no backend.
- **Keep the default and rely on retries.** Hides the problem and doubles the runtime when it appears.

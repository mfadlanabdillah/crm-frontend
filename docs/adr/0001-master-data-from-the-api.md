# ADR-0001: Status, queue, and priority come from the API

- Status: Accepted
- Date: 2026-10-27

## Context

Case status, queue, and priority were hardcoded in the SPA: a zod enum for the URL search, another for
SSE events, i18n keys for the labels, and a tone map for the badges. The skeleton's values (four statuses,
queues `l1`/`l2`/`escalated`) are generic examples; the real taxonomy (record type `CS`, tiers) is not
applied yet and will change. Every new code would have required a frontend release.

## Decision

- `GET /v1/master-data` returns `statuses`, `queues`, and `priorities`, each item `{ code, label, tone }`.
  The server localizes the label; `tone` is the badge color (`neutral`, `info`, `success`, `warning`,
  `danger`, `muted`).
- In the contract these codes are plain strings, not OpenAPI enums.
- URL search params and SSE events accept any code. Badges, filters, the detail selects, and the queue
  navigation are built from master data (`useMasterData`).
- A code the master data does not know renders as the raw code with a neutral tone.
- Selects whose value is a business code start empty and required; there is no hardcoded default.
- `GET /v1/cases/summary` reports counts per queue code (`queues: { <code>: n }`).

## Consequences

- Adding or renaming a status, queue, or priority needs no frontend change.
- `en-US` no longer translates these labels: the server must localize them. The `status.*`, `queue.*`,
  and `priority.*` i18n keys were removed.
- Dropdowns are empty until master data loads, and a stale `status` in a bookmarked URL is left to the
  server to handle.
- The endpoint is **Proposed** in `docs/contract-status.md`; it has not been reviewed with the backend.
- The per-queue icon (escalation had its own) is gone; every queue uses the same icon.

## Alternatives considered

- **Keep enums and i18n labels.** Simple and fully translated, but every new code needs a release.
- **API sends only the code; the frontend keeps labels and tones.** Keeps translations in the repo, but the
  frontend still has to know every code to look good, which defeats the point.

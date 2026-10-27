# ADR-0002: Unsent reply drafts survive session expiry, in memory only

- Status: Accepted
- Date: 2026-10-27

## Context

Any 401 now sends the agent to `/login` with a `redirect` back (handled globally in
`lib/query-client.ts` and `app/auth/session-expiry.ts`). The reply editor then remounted empty, so a long
reply that had not been sent was lost. Replies to customers can contain personal data, and the project
forbids tokens in `localStorage`/`sessionStorage`.

## Decision

- Drafts live in a Zustand store (`modules/case/store/drafts.ts`), in memory only, keyed by
  `${userId}:${caseId}` and storing the editor HTML and the visibility.
- `ModuleDefinition.onSignOut(reason)` receives `'logout'` or `'expired'`. The case module keeps drafts on
  `expired` and deletes them on `logout` (including a logout from another tab).
- The key includes the user id, so another agent who signs in on the same tab never sees the draft.

## Consequences

- After a session expires, signing in again returns to the same case with the text restored.
- Drafts are lost on page reload or when the tab closes, and are not shared between tabs.
- Nothing personal is written to disk by the browser.
- Any new module that holds unsent work must decide what to do for each `reason`.

## Alternatives considered

- **`sessionStorage`.** Survives reloads, but writes possibly personal text to disk unencrypted and sits
  next to the rule against web storage.
- **Delay the redirect until the agent resends.** The agent stays in a dead session and every action fails
  with 401 in the meantime.

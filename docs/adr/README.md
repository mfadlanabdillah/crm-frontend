# Architecture decision records

Short records of decisions that are costly to reverse or easy to forget the reason for. They answer
"why is it like this?" so nobody has to reverse-engineer it. Rules and procedures live in
[AGENTS.md](../../AGENTS.md) and [docs/agents/recipes.md](../agents/recipes.md); ADRs hold the reasoning.

| ADR                                                | Decision                                                                      | Status   |
| -------------------------------------------------- | ----------------------------------------------------------------------------- | -------- |
| [0001](0001-master-data-from-the-api.md)           | Status, queue, and priority come from the API, not from code                  | Accepted |
| [0002](0002-unsent-drafts-in-memory.md)            | Unsent reply drafts survive session expiry, in memory only                    | Accepted |
| [0003](0003-forms-with-react-hook-form-and-zod.md) | Forms use React Hook Form + Zod with i18n-key messages                        | Accepted |
| [0004](0004-e2e-with-two-workers.md)               | E2E runs with 2 workers                                                       | Accepted |
| [0005](0005-ui-primitives-on-demand.md)            | UI primitives are added when a feature needs them                             | Accepted |
| [0006](0006-english-first-language-policy.md)      | English for code and technical docs, Indonesian for README and product        | Accepted |
| [0007](0007-public-repository-neutral-branding.md) | Public repository with neutral branding and no license yet                    | Accepted |
| [0008](0008-shared-ui-package.md)                  | UI components live in a shared package, and lint enforces their use           | Accepted |
| [0009](0009-micro-frontends.md)                    | The console is a shell; every domain, including customer service, is a remote | Proposed |

ADRs written before 2026-10-28 call the app `crm-agent`; it is now `crm-console` (`apps/crm-console`). They are
left as written, as the rules above require.

Earlier stack decisions (React + Vite, TanStack, Tailwind, and so on) are in the internal proposal and
RFC of the project this starter was created from; they are not repeated here.

## When to write one

Write an ADR when a decision changes a rule in `AGENTS.md`, adds or removes a dependency, shapes the API
contract, or you expect someone to ask "why did we do it this way?" within a year. Do not write one for
a bug fix or a refactor.

## How

1. Copy the template below to `NNNN-short-title.md` using the next free number (no gaps, no reuse).
2. Fill it in. Cite evidence (measurements, commits) instead of opinions.
3. Add a row to the table above in the same pull request.
4. Never rewrite an accepted ADR to change its decision: add a new one and mark the old one
   `Superseded by ADR-NNNN`. Fix typos and add links freely.

A test (`apps/crm-console/scripts/agent-docs.test.mjs`) checks the numbering, the required headings, a valid
status, and that every ADR is listed above.

## Template

```markdown
# ADR-NNNN: Title

- Status: Proposed | Accepted | Deprecated | Superseded by ADR-NNNN
- Date: YYYY-MM-DD

## Context

What forces are at play, and what was observed.

## Decision

What we do, stated plainly.

## Consequences

What gets easier, what gets harder, what to watch.

## Alternatives considered

What else was possible, and why it lost.
```

# ADR-0006: English for code and technical docs, Indonesian for README and product text

- Status: Accepted
- Date: 2026-10-27

## Context

The repo mixed languages without a rule: Indonesian README, comments, test names, ESLint messages, and
product text; English commits and, after review, agent docs. `AGENTS.md` is loaded into an AI agent's
context at the start of every session, so its size is paid every time; English text generally needs
fewer tokens than the same text in Indonesian (a general property of tokenizers; not measured for this
file). The team is Indonesian, and the product's default locale is `id-ID`.

## Decision

- **English:** code, comments, test names, commit messages, ESLint messages, and technical docs
  (`AGENTS.md`, `docs/`, ADRs).
- **Indonesian:** `README.md` and product text (the `id-ID` locale; `en-US` mirrors it).
- Older Indonesian comments, test names, and lint messages are translated when the code is touched; there
  is no mass rewrite.
- Tests and examples may quote Indonesian UI strings (such as the `Keluar` button) because they must match
  the product.

## Consequences

- Cheaper and more consistent agent context.
- Indonesian juniors read English recipes; the README, their entry point, stays Indonesian.
- The repo stays mixed for a while, by design, until older code is touched.
- The module generator already prints English, and its test checks for it.

## Alternatives considered

- **All Indonesian.** Easiest for the current team, but costlier per agent session and awkward to share
  outside the team.
- **All English, including the README.** Most uniform, but the README is the first thing the team reads.

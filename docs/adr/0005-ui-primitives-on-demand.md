# ADR-0005: UI primitives are added when a feature needs them

- Status: Accepted
- Date: 2026-10-27

## Context

The stack is described as "shadcn/ui pattern", yet `components/ui/` holds a handful of primitives
(`button`, `input`, `select`, `textarea`, `badge`, `skeleton`, `form-field`, `data-state`). A newcomer
building a dialog or dropdown wonders where it is. Adding Dialog, DropdownMenu, and Toast up front looked
like the obvious fix, so the shadcn CLI was tried in a throwaway copy (`shadcn@4.22.1 add dialog`). It:

- added an unrelated npm package named `cn` (`^0.5.0`) next to `radix-ui` with a `^` range, against the
  repo's exact-pin rule;
- used color tokens this theme does not define (`bg-background`, `text-muted-foreground`, `bg-accent`),
  which silently produce no styles;
- referenced a `Button` variant that does not exist (`outline`), so `pnpm typecheck` failed.

## Decision

Do not add primitives speculatively. A feature that needs one adds it using the "Add a UI primitive"
recipe, which pins the CLI version and lists the review steps (remove the stray package, pin `radix-ui`,
map tokens and variants to ours, add a test, and an axe check when it traps focus).

## Consequences

- No unused dependencies or code; every primitive in the repo has a caller.
- The first feature that needs a dialog pays the integration cost, with a recipe to follow.
- The recipe records version-specific facts (verified with `shadcn@4.22.1`) and must be re-checked when the
  CLI version is bumped.

## Alternatives considered

- **Add a standard set up front.** The same adaptation work, plus code nobody uses and nobody tests.
- **Hand-write every primitive.** Avoids the CLI's surprises but throws away accessible Radix behavior.

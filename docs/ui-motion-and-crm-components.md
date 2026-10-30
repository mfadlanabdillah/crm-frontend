# CRM components and motion: design spec

Status: **draft**, written from the author's assumptions (marked as such) before any code. Nothing here is
built yet. It extends [ui-standards.md](ui-standards.md); where the two disagree, `ui-standards.md` wins
until this spec is accepted and that document is updated.

## Intent

Make the console feel modern and fluid for CS agents: panels, notifications, and data changes move
smoothly instead of snapping. The visual identity stays as it is (tokens in `packages/ui/src/theme.css`),
and screens keep being built from `@crm/ui`. Assumption: the problem is feel, not missing features.

## Current state

- Motion today is `transition-colors` on `Button` and `animate-pulse` on `Skeleton`. Nothing else moves.
- There is no animation library. `AGENTS.md` forbids adding a package for a few lines of code.
- The initial bundle is about 200 KB gzip against a 300 KB budget (`pnpm size`).
- `@crm/ui` has no `Dialog`, `Drawer`, `Toast`, `Tabs`, `Tooltip`, or `Menu`.

## References

Patterns are taken from these projects. Code is not copied.

| Project                                     | Used as a reference for                                             | License                                                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atomic CRM (React, shadcn/ui, Supabase)     | CRM components: contacts, activity timeline, notes, tasks, pipeline | MIT                                                                                                                                                              |
| shadcn-admin (Vite, React, TanStack Router) | Shell and navigation                                                | MIT                                                                                                                                                              |
| Shadcn Dashboard                            | Ticket and table layouts                                            | Unclear: the repository says MIT, the project site publishes a proprietary free license that forbids redistribution as a template or kit. Visual reference only. |

## Goals

- A small set of components common to CRM tools, added to `@crm/ui`, each exported, unit tested, and shown
  in the design-system gallery (`apps/crm-console/src/app/design-system/Gallery.tsx`).
- Consistent, restrained motion defined once as tokens and reused.
- No regression in accessibility: the axe scan stays clean and focus stays managed.

## Non-goals

- New business features, new endpoints, or changes to the API contract.
- Changes to the color tokens or the visual identity.
- A kanban board in the first phases (it needs a drag-and-drop dependency).

## Anti-goals

A result that technically works but is a failure:

- The axe scan reports violations, or keyboard and screen-reader use gets worse.
- The initial bundle goes over 300 KB gzip.
- Animation blocks interaction, drops frames, or makes end-to-end tests flaky.
- A new component lives inside an app instead of `@crm/ui` (lint also rejects raw controls and palette colors).

## Components

Assumed priority, highest first:

1. **Toast**, replacing the inline "Status diperbarui" alert on the case detail page.
2. **Dialog** and **Drawer**, so a case can open as a side panel without leaving the list.
3. **Tabs** with a sliding indicator.
4. **Tooltip**, **Popover**, and **Menu**.
5. **Command palette** to find a case or customer.
6. Filter chips with saved views, **Avatar**, **Breadcrumb**, and skeleton table rows.
7. Kanban board of the queues, deferred.

## Motion

Assumption: CSS first, no new dependency. Tailwind 4 transitions, `@starting-style` for elements that
enter, and the View Transitions API for route changes.

- Motion tokens (durations and easing) live in `theme.css` next to the other tokens. Micro-interactions
  take 120 to 200 ms; panels and route changes take 200 to 300 ms.
- Animate only `transform` and `opacity`.
- Uses: a panel sliding in, a toast entering and leaving, a new list item, a cell that changes after an
  optimistic update (for example a queue move), the tab indicator, button press feedback, and a route
  crossfade.
- `prefers-reduced-motion: reduce` is honored globally by shortening durations to zero.
- End-to-end tests run with reduced motion (`reducedMotion: 'reduce'` in the Playwright config) so
  animation cannot make them flaky.

## Phases

1. Motion tokens, the reduced-motion rule, and the Playwright setting.
2. Toast, Dialog, Drawer, and Tabs.
3. Apply them on the case detail page: panel, toast, change highlight, and route transitions.
4. Command palette and filter chips.
5. Optional: kanban.

Each phase is verified with `pnpm check`, `pnpm test:e2e`, the axe scan, and the gallery. UI changes in a
pull request include screenshots.

## Open decisions

These need an owner's answer before the phase that depends on them:

1. **Primitives for Dialog, Drawer, and Popover.** Native elements (`<dialog>` and the Popover API, no
   dependency) or Radix primitives (mature accessibility, but a new pinned dependency). The author's
   recommendation: native first, checked with axe, and Radix only if native falls short.
2. **Drag-and-drop library** for the kanban board, if phase 5 goes ahead.
3. **Dark mode.** There are no tokens for it today; decide whether it is in scope.

## Not yet verified

- The View Transitions API has not been tested against the browser versions the team supports.
- The assumed priority order comes from the author, not from agent feedback.

# ADR-0008: UI components live in a shared package, and lint enforces their use

- Status: Accepted
- Date: 2026-10-28

## Context

The UI primitives lived inside the one app (`apps/crm-agent/src/components/ui`). An audit of the code
found:

- Reuse inside the app was already good: no raw `button`, `input`, `textarea`, or `table` outside the
  primitives (a grep found none; the lint rule below later found three the grep missed because the tag
  was split across lines).
- Patterns that were not components yet and were written by hand again and again: the bordered panel
  (6 places), the uppercase label/value pair (11), previous/next paging (2 implementations), a plain
  table (1), inline error text (5), and a two-option toggle (1).
- Six colors written straight from the Tailwind palette (`bg-emerald-500`, `text-red-700`, ...) next to
  a token set that had no soft or ink variant for success, warning, and danger.
- Only 2 of the 8 primitives had a test.
- A second app, a package, or a micro frontend remote cannot import from inside another app, so each
  would copy the primitives and their CSS. That is how a design system drifts.

## Decision

1. **Components and tokens live in `packages/ui` (`@crm/ui`).** The package holds the primitives
   (`Button`, `Input`, `Select`, `Textarea`, `Badge`, `Skeleton`, `FormField`, `EmptyState`,
   `ErrorState`) and the repeated patterns (`Card`, `DescriptionList`, `Table`, `Pagination`, `Alert`,
   `PageHeader`, `Page`, `SegmentedControl`, `TextLink`). The design tokens are in
   `@crm/ui/theme.css`; an app imports them in its Tailwind entry and adds
   `@source` for `packages/ui/src`, because Tailwind does not scan `node_modules`.
2. **Two lint rules enforce it** (`eslint.config.js`): a raw `button`, `input`, `select`, `textarea`,
   or table element in an app is an error, and so is a color from the Tailwind palette or a hex value in
   a class string (anywhere in apps and in the package). A virtualized table may disable the first rule
   with a reason. Tests are exempt.
3. **Status colors have three roles** (solid, soft, ink), with the soft and ink pairs checked for
   WCAG AA contrast. The soft and ink values equal the palette colors they replace, so badges look the
   same (a pixel comparison of four pages confirmed it). Two small differences are deliberate: the
   connection dot uses the solid token, a shade darker than before, and the "status updated" message
   uses the ink token for AA contrast.
4. **A dev-only gallery** (`/design-system`) shows every component in every state, and the axe e2e
   scans it, so a component state cannot ship inaccessible.
5. The rules for using all of this are in [docs/ui-standards.md](../ui-standards.md).

This refines ADR-0005: its decision (add a primitive when a feature needs it, never speculatively) stands;
only the location changed, and `apps/crm-agent/components.json` (the shadcn CLI configuration for the old
location) was removed. The recipe in `docs/agents/recipes.md` is the source of truth for adding one.

## Consequences

- Any app, package, or remote builds screens from the same components, and a change to the look is one
  edit.
- Every component has a test and appears in the gallery.
- Lint rejects ad-hoc controls and colors, so the standard does not depend on review alone. The price is
  friction when a new need appears: the answer is to add the component, not to bypass the rule.
- Tailwind generates CSS only for classes it can see. The host's `@source` covers the package; a
  micro frontend remote that ships its own Tailwind utilities would render them unstyled. Remotes must use
  `@crm/ui` only.
- The package depends on `react-i18next` for a few default texts (retry, page summary), so those keys live
  in `@crm/i18n`.

## Alternatives considered

- **Keep the primitives in the app and copy them where needed.** Cheapest today, and it duplicates every
  fix.
- **Storybook.** Richer than the gallery, but a new toolchain and dependency set to maintain for a small
  component set; the gallery plus axe covers the need now.
- **Per-app CSS for patterns.** Fast to write, and it is how three copies of a table and a pager appear.
- **Use the shadcn registry as the package.** It would bring tokens and variants this theme does not
  define (see ADR-0005).

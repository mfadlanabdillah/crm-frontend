# ADR-0003: Forms use React Hook Form + Zod with i18n-key messages

- Status: Accepted
- Date: 2026-10-27

## Context

A CRM is form-heavy, but the repo had no form at all (only a search box), and `react-hook-form` had been
removed as unused. The first person to build a form would have had to pick a library, a validation
pattern, and accessible field markup. Zod is already the schema language for search params and events.

## Decision

- React Hook Form 7.90.0 with `@hookform/resolvers` 5.9.1, with Zod schemas (the language already used for search params and events).
  Resolvers 5.9.2 and 6.0.0 were less than two weeks old when this was decided (the repo's rule is to
  prefer older releases).
- Zod messages are **i18n keys** (`'cases.create.errors.subjectShort'`) and are translated at render time.
- `components/ui/form-field.tsx` wires label, hint, and error to a control through `id`,
  `aria-describedby`, and `aria-invalid`. It does not depend on the form library.
- The form component is presentational (`onSubmit(request)`, `onCancel`, `isPending`, `error`); the page
  owns the mutation and navigation. `modules/case/components/CaseForm.tsx` is the reference.
- The field-wiring pattern follows `shadcn-ui`'s `form.tsx` (MIT) as a reference, with our own code.

## Consequences

- One pattern for every future form; validation messages are translated like any other text and covered
  by the i18n parity test.
- RHF and the resolver add weight, but only to the route chunk that uses a form.
- Tests must match labels exactly (`getByLabel(text, { exact: true })`), because label matching is a
  case-insensitive substring and can hit unrelated inputs such as the list search box.

## Alternatives considered

- **TanStack Form.** Deeper type safety and the same ecosystem, but newer and less proven; the recipe can
  be revisited if dependent fields prove awkward in RHF.
- **No library.** Fine for one field, error-prone for the long and dependent forms a CRM will have.

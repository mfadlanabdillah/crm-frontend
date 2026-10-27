# ADR-0007: Public repository with neutral branding and no license yet

- Status: Accepted
- Date: 2026-10-27

## Context

The starter was extracted from an internal project and published as a public repository under a personal
account. The source contained the company name (page title, shell, login text, mock user emails), the
internal context that it replaces a Salesforce console, a workflow that called a private review-tooling
repository with two secrets, and a mock user with a real person's name.

## Decision

- Publish `crm-frontend` publicly with a fresh single-commit history; do not carry over the internal docs.
- Neutralize identity: title "CRM Agen", sidebar "Customer Service", logo "CA", generic login text, mock
  emails on `example.com`, fictional names, and no mention of Salesforce.
- Remove `.github/workflows/code-review.yml` because it depends on a private repository and secrets;
  re-add it when that tooling is published or the repository moves into an organization.
- Do not add a `LICENSE` or `CONTRIBUTING.md` for now (the owner declined on 2026-10-27).

## Consequences

- Without a license, all rights remain with the author: others may view and fork on GitHub but have no
  permission to reuse the code. Revisit before inviting outside contributors or moving to an organization.
- `CODEOWNERS` still names the personal account; the `staging` and `master` branches described in the
  docs do not exist yet, so pull requests target `development`.
- Commits carry the author's personal email.
- Team-specific branding is re-added by the team that adopts the starter.

## Alternatives considered

- **Private repository.** Safe, but the owner wanted a shareable starter.
- **Publish as is.** Quicker, but ties the repository to an employer and exposes internal context.

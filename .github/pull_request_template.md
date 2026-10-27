# Description, Motivation and Context

# Link to the resources (mockups, change description)

# What is the destination branch of this PR?

# How Has This Been Tested?

# Screenshots [Mandatory for UI changes]

# Does this change require updates outside of the code, like updating the documentation, configuration? If so, was this done?

# Do reviewers need to manually test your changes?

# Does similar functionality already exist in the codebase? If so, why isn't it reused?

# Checklist:

- [ ] `pnpm check` passes locally (lint, typecheck, test, build, size).
- [ ] New logic has unit tests; critical flows have e2e coverage.
- [ ] New user-facing text is added to both locales (`id-ID`, `en-US`).
- [ ] Permission checks go through `packages/auth` (no `role === '...'` in components).
- [ ] No direct `fetch` in components; API calls go through `@crm/api-client` and the feature `api/` facade.

# Which variants have been affected

- [ ] Production
- [ ] Staging
- [ ] Develop

# Size of change

- [ ] small (0-29 lines)
- [ ] medium (30-99 lines)
- [ ] large (100-300 lines)
- [ ] freaking huge (>300 lines)

# env change

# Files with major changes / what is worth paying more attention to?

(Delete this point if it is not needed)

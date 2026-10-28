# API contract status

The contract in `packages/api-client/openapi/openapi.yaml` was written by this repo so the UI can be
built and tested against a mock. This table says how far each endpoint can be trusted.

| Status          | Meaning                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| **Stable**      | Agreed with the backend/BFF owners. Breaking changes need their review.               |
| **Provisional** | Defined here and mocked with MSW. Plausible, but may change when the real API exists. |
| **Proposed**    | New in this repo and not yet reviewed with the backend/BFF owners.                    |
| **Mock only**   | Exists only in the dev mock; not part of the contract.                                |

Today **no endpoint is Stable**. Build against the table, but keep every call behind the module
facade (`modules/<id>/api/`) so a contract change stays local.

| Endpoint                               | Used by                                    | Status      | Notes                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/session`                      | `app/auth/session.ts`                      | Provisional | `401` means signed out; the client returns `null` instead of throwing                                                                                                                 |
| `POST /v1/auth/logout`                 | `app/auth/sign-out.ts`                     | Provisional | Cookie-based session; the client sends `X-CSRF-Token`                                                                                                                                 |
| `POST /v1/dev/session`                 | `app/auth/sign-in.ts`                      | Mock only   | Creates a mock session; replace with the real SSO flow                                                                                                                                |
| `GET /v1/master-data`                  | `modules/case/queries/useMasterData.ts`    | Proposed    | Statuses, queues, priorities as `{ code, label, tone }`; labels localized by the server Optional `refundStatuses` (proposed; Finance PoC).                                            |
| `POST /v1/cases`                       | `modules/case/queries/useCreateCase.ts`    | Proposed    | Example for the form pattern. `subject`, `priority`, `queue` (+ optional `description`); customer linkage is not designed, the mock links the first customer; `422` for invalid input |
| `GET /v1/cases`                        | `modules/case/queries/useCases.ts`         | Provisional | Server-side filter, sort, pagination; `status` and `queue` values come from master data Optional `customerId` filter (proposed; used by the customer profile).                        |
| `GET /v1/cases/summary`                | `modules/case/queries/useCaseSummary.ts`   | Proposed    | Open count per queue code in `queues`, plus `unassigned` and `overdue`                                                                                                                |
| `GET /v1/cases/{caseId}`               | `modules/case/queries/useCase.ts`          | Provisional | Includes the timeline; PII masked by role                                                                                                                                             |
| `PATCH /v1/cases/{caseId}`             | `modules/case/queries/useUpdateCase.ts`    | Provisional | Body fields: `status`, `queue`, `priority`, `assigneeId`; the mock checks `case.assign`, `case.status.update`, and `case.escalate` (for a `queue` change)                             |
| `POST /v1/cases/{caseId}/replies`      | `modules/case/queries/useReplyToCase.ts`   | Provisional | Body is editor HTML (the UI shows it as plain text); `visibility` is `customer` or `internal`                                                                                         |
| `GET /v1/customers`                    | `modules/customer/queries/useCustomers.ts` | Provisional | Requires `customer.view`                                                                                                                                                              |
| `GET /v1/customers/{customerId}`       | `modules/customer/queries/useCustomer.ts`  | Provisional | Requires `customer.view`; PII masked by role                                                                                                                                          |
| `GET /v1/events/stream` (SSE)          | `modules/case/queries/useCaseStream.ts`    | Provisional | Only the `CaseEvent` schema is in the OpenAPI file, not the path; the mock has no handler, events are simulated client-side with `VITE_MOCK_EVENTS`                                   |
| `GET /v1/finance/refunds`              | `apps/crm-finance/src/FinancePage.tsx`     | Proposed    | Micro frontend PoC only; the Finance domain is not agreed. Needs `case.export` as a stand-in permission; `status` comes from master data `refundStatuses`                             |
| `PATCH /v1/finance/refunds/{refundId}` | `apps/crm-finance/src/FinancePage.tsx`     | Proposed    | Micro frontend PoC only. Body `decision` (`approved` or `rejected`) and a `note`; `409` when already decided, `422` for a short note                                                  |

## Keeping this table true

- Change `openapi.yaml` and this table in the same PR.
- When the real API agrees with an endpoint, set it to **Stable** and remove its mock-only assumptions.
- An AI agent must not promote an endpoint to **Stable** on its own.

# Phase 0 — Traceability, acceptance criteria, and roadmap

## Requirement traceability matrix

| Requirement group | Modules | Primary entities | Routes | Verification |
|---|---|---|---|---|
| Authentication/account lifecycle | identity, access, audit | user_account, session, reset token, MFA, audit | public account routes, profile sessions | unit + security integration + brute-force tests |
| Admin dashboard | reporting plus all domains | reporting projections/outbox activity | `/admin/dashboard` | seeded database KPI and filter tests |
| Resident management/ID card | resident, society, files, identity | resident, occupancy, unit, vehicle, documents, card | `/admin/residents/*`, `/portal/profile` | registration, uniqueness, access, upload and PDF tests |
| Dues/payments/receipts | billing, audit, notification | fee plans, dues, ledger, payment, allocations, receipts | admin and portal payment routes, webhook API | transaction, concurrency, idempotency and reconciliation tests |
| Staff/workers/salaries | workforce, files | staff, salary, worker, skills/categories | admin staff/workers | salary posting, availability and authorization tests |
| Complaints | complaint, files, notification | complaint, messages/events | admin/portal complaints | lifecycle, confidentiality and ownership tests |
| Maintenance | maintenance, workforce, notification | request, assignment, messages/events | admin/portal maintenance | assignment privacy, schedule, transitions and rating tests |
| Notifications/announcements | notification, outbox, files | templates, notification, recipients, attempts, announcement | admin notifications/announcements; portal center | audience, dedupe, retry, expiry and read-state tests |
| Settings/audit/reports | society, access, reporting, audit | setting, roles, audit, export jobs | admin settings/reports | effective dating, privilege, redaction and export tests |

## Phase acceptance criteria

### Phase 0 — Discovery and planning

- Every supplied functional and non-functional requirement is represented in the checklist or traceability matrix.
- Java architectural deviation is explicit and does not remove requested behavior.
- Module boundaries, data entities, key constraints, role permissions, routes, status transitions, ledger rules and provider abstractions are documented.
- Ambiguities have proposed defaults and affected phases.
- No application implementation starts before approval.

### Phase 1 — Foundation

- Java build, formatting, static analysis and test pipeline pass.
- PostgreSQL boots from migrations and seed data creates demo society/roles/accounts.
- Both portal shells authenticate through secure sessions and enforce server-side permissions.
- Password reset, forced change, account states, rate limiting, optional admin 2FA seam, audit, errors, validation and base responsive design work.
- Testcontainers integration tests prove same-society and cross-resident denial.

### Phase 2 — Resident management

- Admin can create/search/edit/status/archive residents with complete conditional tenant fields and protected uploads.
- Resident number generation is collision-safe under concurrency; occupancy conflicts are rejected.
- ID card is generated, printable, downloadable, revocable/regenerable and minimally verifiable by QR.
- Residents see only their own profile/documents/card; exports are authorized and audited.

### Phase 3 — Dues and payments

- Effective-dated fee changes never mutate historical charges.
- Due generation, partial/selected/oldest allocation, advance credit, late fee, waiver, adjustment and reversal rules reconcile exactly.
- Manual and mock-online payment paths are transactional and idempotent; callbacks, pending/failure states and bank proof work.
- Receipt generation occurs only after confirmation; financial views and exports derive from ledger facts.

### Phase 4 — Staff and workers

- Staff/worker profiles, protected documents, categories, skills, service area, status and availability are complete.
- Monthly salary states, payments, reversals where applicable and salary-slip generation reconcile.

### Phase 5 — Complaints and maintenance

- Both workflows enforce legal transitions and preserve complete timelines.
- Confidentiality and resident ownership are tested; internal notes never leak.
- Worker assignment, change, scheduling, least-data notifications, completion, reopen and rating function and are audited.

### Phase 6 — Notifications

- In-app notification center, general announcements and filtered payment reminders support schedule/expiry/read state.
- Audience preview and execution are safe; delivery attempts, retries and failures are visible.
- Email/SMS/payment/provider adapters can be swapped without domain changes.

### Phase 7 — Settings and reports

- All named settings are configurable under permissions and effective-dated when historical facts are affected.
- Required reports/exports, audit viewer, data export, privacy/retention controls and backup/restore runbook exist.

### Phase 8 — Quality and release

- Unit, integration, authorization, workflow, ledger, upload, callback and end-to-end critical journeys pass.
- Accessibility, responsive, security, performance and recovery reviews meet documented targets.
- Deployment, operations, administrator and resident documentation is complete and verified.

## Incremental implementation roadmap

| Milestone | Planned modules/files | Database work | Exit evidence |
|---|---|---|---|
| 1A Bootstrap | Maven build, application shell, configuration, shared primitives | society and Flyway baseline | clean build and containerized DB test |
| 1B Identity/RBAC | identity, access, audit, login/account UI | users, roles, permissions, sessions, audit | account lifecycle and denial tests |
| 1C UI foundations | design system, admin/resident shells, errors/validation | seed settings/demo users | responsive shells and accessibility smoke test |
| 2 Resident | society/resident/files/card modules and views | property, unit, resident, occupancy, files, sequences | creation/search/archive/card journeys |
| 3A Billing core | fee/due/ledger services | fee, due, ledger and rule tables | effective-date and reconciliation tests |
| 3B Payments | providers, allocations, callbacks, receipts | payment, attempt, allocation, adjustment, receipt | idempotent payment/reversal journeys |
| 4 Workforce | staff/worker/salary UI and services | workforce and salary tables | salary and assignment-readiness tests |
| 5 Service desk | complaint and maintenance UI/services | tickets, messages, events, assignments | full ticket journeys and privacy tests |
| 6 Messaging | templates, outbox dispatch, announcement/reminder UI | notification, recipient, attempt, outbox | scheduling, retry and read-state tests |
| 7 Operations | settings, reports, exports, retention and audit viewer | settings/export projections/indexes | authorized reports and recovery rehearsal |
| 8 Release | hardening, docs, deployment automation | final migration review | complete quality gate |

## Test personas planned for Phase 1

Local-only seed credentials will be generated from development configuration and displayed once at seed time. Planned personas are `superadmin`, `admin`, `accounts`, `maintenance`, `resident.owner`, and `resident.tenant`. No production credential will be committed.

## Phase 0 completion statement

The architecture is ready for review. Phase 1 should not begin until the user approves the Java/Vaadin direction and either accepts the proposed defaults or answers the blocking decisions for Phase 1, especially the single-society versus multi-society model.

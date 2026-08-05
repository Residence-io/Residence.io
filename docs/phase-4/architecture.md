# Phase 4 workforce architecture

Phase 4 adds a `WorkforceModule` to the NestJS API and permission-aware Next.js App Router pages. It uses the existing session authentication, RBAC, audit log, outbox, private storage, Prisma, PostgreSQL, and PDF foundations. Staff salary data is intentionally separate from resident dues and ledgers.

## Data and invariants

- Society-scoped atomic PostgreSQL sequences produce stable `STF-{YEAR}-{SEQUENCE}`, `WRK-{CATEGORY}-{YEAR}-{SEQUENCE}`, and salary-slip numbers.
- Effective-dated salary structures are non-overlapping. Each salary record snapshots basic pay, allowances, deductions, currency, and the source structure.
- `(staff, period)` and payment idempotency constraints make monthly generation and payment submission repeat-safe.
- Completed payments are not edited or deleted. Corrections create compensating adjustments and mark reversals.
- Worker reservations use a PostgreSQL exclusion constraint to reject overlapping active reservations.
- Identity values are encrypted and exact-search hashed; API responses expose only a masked suffix. Private documents use randomized object keys and authorization on every download.

## Phase 5 boundary

`POST /workforce/workers/eligible` is the assignment-readiness interface. It evaluates society time zone, worker status, category, skills, service area, working hours, leave/unavailable overrides, and existing reservations. Phase 4 creates only administrative reservations; complaints, maintenance tickets, and resident assignments remain Phase 5 work.

## API and UI

The API exposes departments, job titles, staff, lifecycle history, salary structures/periods/payments/adjustments/slips, worker setup, workers, availability, reservations, performance notes, protected documents, dashboard aggregates, and bounded CSV exports under `/workforce`.

Administration routes are `/admin/departments`, `/admin/staff`, `/admin/staff/new`, `/admin/staff/[id]`, `/admin/staff/[id]/edit`, `/admin/staff/salaries`, `/admin/staff/salaries/[period]`, `/admin/worker-categories`, `/admin/workers`, `/admin/workers/new`, `/admin/workers/[id]`, `/admin/workers/[id]/edit`, and `/admin/workers/availability`. Safe slip verification is `/verify/salary-slip/[token]`.

Phase 5 and Phase 6 are not implemented by this change.

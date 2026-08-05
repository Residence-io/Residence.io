# Supabase migration roadmap

## Governing rules

- NestJS remains operational until S8. A prompt, migration file, HTTP 200, or hidden button is not completion evidence.
- One bounded domain has one write authority at a time. Shadow reads are allowed; uncontrolled dual-write is not.
- Every cutover requires a feature flag, backup/checkpoint, reconciliation queries, authenticated browser/API/RLS/database tests, reload persistence, and a rehearsed rollback.
- Supabase CLI SQL migrations become the single database migration authority in S1. Prisma remains a transitional client/schema contract only and no longer authors or deploys migrations.
- No production project or data is touched before the S9 release gate.

## Phase plan

| Phase                                                          | Scope                                                                                                                                                                          | Exit evidence                                                                                              | Rollback                                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **S0 — Architecture and readiness**                            | Inventory 105 models/19 controllers, replacement matrix, RLS/Auth/Storage designs, workload limits, risks, and roadmap                                                         | Eight reviewed documents; no runtime change                                                                | Delete/revise uncommitted documents only; system unchanged                                                               |
| **S1 — Local Supabase foundation and migration system**        | Install/pin CLI locally, create `supabase/config.toml`, convert the ten authoritative SQL migrations, resolve substantive drift, add local reset/upgrade/schema/security tests | Fresh local Supabase reset and seven-to-current upgrade pass; schema diff explained; no remote project     | Stop local stack; NestJS/local PostgreSQL remain authoritative; revert only S1 files                                     |
| **S2 — Supabase Auth and role mapping**                        | Add Auth links/state, prove Argon2 import, map username/email/phone, role helpers/claims, pilot cohort, SSR session path                                                       | Correct/incorrect login, reset, revoke, suspended state, last-admin, cross-society and rollback tests pass | Disable cohort feature flag; retain NestJS hashes/sessions; forced reset only where password changed under new authority |
| **S3 — Society/resident/property RLS**                         | Implement private helpers, safe views, RLS for society/property/resident/occupancy/household/vehicle/ID metadata and bounded RPCs                                              | Full role/owner/cross-society policy suite; registration and lifecycle reconciliation                      | Route reads/writes back to NestJS; preserve Supabase rows and reconcile before retry                                     |
| **S4 — Supabase Storage and document migration**               | Private buckets, upload finalization, signed access, manifest/checksum copy for resident/ticket/workforce/finance/generated objects                                            | Zero unexplained missing/orphan/mismatch objects; access and visual PDF/QR tests pass                      | Feature flag returns reads/writes to filesystem; retain copied objects for rollback window                               |
| **S5 — Finance and immutable ledger**                          | Effective settings, fees, dues, payment allocation, proofs, ledger, reversals/refunds, receipts and provider callback RPC/Edge paths                                           | Decimal/concurrency/idempotency tests; old/new balances and receipts reconcile exactly                     | Stop new Supabase writes; revert route owner; replay only idempotent events after reconciliation                         |
| **S6 — Workforce, complaints and maintenance**                 | Staff/payroll, worker schedules, ticket privacy/workflows, assignment/appointment/disclosure                                                                                   | Salary/assignment/transition history matches; RLS and overlap tests pass                                   | Domain flags route to NestJS; reservations created after checkpoint are reconciled/cancelled explicitly                  |
| **S7 — Notifications, scheduling, reports and audit**          | Templates, audience snapshots, `pgmq`/Cron processing, provider callbacks, dashboards, bounded reports/exports, append-only audit                                              | Duplicate/retry/dead-letter, totals, CSV safety, audit redaction and scale tests pass                      | Pause queue/Cron, retain messages, route compose/report operations to NestJS, reconcile idempotency keys                 |
| **S8 — Frontend cutover and NestJS retirement**                | Replace frontend API calls domain by domain, remove legacy session dependence, freeze then retire proven NestJS modules                                                        | All workflows pass with NestJS unavailable; dependency/route inventory shows no hidden callers             | Re-enable NestJS deployment and feature flags during approved rollback window; Auth password caveat applies              |
| **S9 — Staging import, reconciliation and production release** | Full-scale staging import, object copy, performance/security/recovery rehearsal, production change plan and release                                                            | Signed reconciliation, RPO/RTO rehearsal, approval, monitored production release                           | Execute pre-approved restore/cutback plan; never improvise destructive rollback                                          |

## S1 migration ownership design

1. Copy the exact ten checked-in Prisma migration SQL files into ordered `supabase/migrations` files and record source path plus SHA-256 in a conversion manifest. Do not rewrite their SQL during recovery.
2. Add later Supabase-only migrations for required schemas, grants, extensions, drift corrections, Auth links, RLS, Storage policies, functions, and triggers.
3. Treat `supabase/migrations` as authoritative after the switch. Keep `apps/api/prisma/migrations` as a read-only historical archive until NestJS retirement; do not run `prisma migrate deploy` after the switch.
4. Keep `schema.prisma` during transition as a derived Prisma-client contract. Every Supabase SQL migration that changes application tables must update/validate that contract in the same review. Prisma schema changes never precede SQL.
5. CI runs local `supabase db reset`, migration lint/security tests, Prisma validation/generation, and a schema compatibility diff. Any unexplained diff fails CI.
6. For an existing database, establish Supabase migration history only after exact checksum and schema reconciliation. Use the supported CLI history repair mechanism in a disposable rehearsal first; never mark an unknown migration applied.

## Drift disposition for S1

The current column-level incompatibility is resolved, but the last audit still showed four schema-declared indexes absent from PostgreSQL and 88 apparent index renames caused primarily by Prisma name/map metadata. S1 must classify each item:

- Add only indexes justified by query plans, uniqueness/invariant requirements, or RLS lookup performance.
- The known candidates are complaint administrator assignment `(complaint_id, ended_at)`, worker assignment `(maintenance_request_id, status)`, and redundant non-unique normalized username/email indexes already covered by unique indexes.
- Do not rename working database indexes solely to satisfy cosmetic Prisma metadata.
- Inspect constraint/default/function/extension differences separately and document every accepted difference.

Fresh deployment applies the entire Supabase history to an empty local Supabase database. Upgrade testing applies the original seven migrations, inserts representative records from every domain, then applies the three recovered migrations and S1 baseline/drift migrations. Both paths run representative Prisma and Supabase client queries until the corresponding domain is retired.

## Cutover evidence template

For each bounded domain record:

- feature flag and current write owner;
- migration versions/checksums;
- row counts, monetary totals, sequence maxima, status counts, and object checksums;
- role/permission/owner/cross-society test results using real JWTs;
- browser workflow plus refresh/reload persistence;
- queue/outbox lag and failures;
- rollback command, checkpoint, operator, expected data loss window, and rehearsal result.

## Exact Phase S1 implementation prompt

```text
Implement Supabase Migration Phase S1 — Local Supabase Foundation and Migration System for Residence.io.

Repository: C:\Users\M. Ali\Documents\oppo\Residence.io

Read all docs/supabase-migration Phase S0 documents first. Preserve every existing dirty file and keep NestJS, Prisma Client, the current local PostgreSQL workflow, authentication, UI, and business behavior operational. Do not create, link, deploy, or modify a remote Supabase project. Do not add Supabase Auth, RLS domain policies, Storage migration, frontend cutover, or Phase S2 work.

Required work:
1. Capture branch, HEAD, dirty baseline, tool versions, existing ten migration names/checksums, current Prisma schema diff, and extension requirements.
2. Add a pinned local Supabase CLI workflow and minimal supabase/config.toml using safe local placeholders only. Never add credentials or an environment file.
3. Make supabase/migrations the single future migration source of truth. Convert the exact ten authoritative Prisma SQL migrations without changing their SQL, and add a machine-readable source/checksum manifest.
4. Keep apps/api/prisma/migrations as an explicitly read-only historical archive during transition. Disable no runtime behavior yet. Document that prisma migrate deploy must not be used after the S1 authority switch.
5. Classify every Prisma/PostgreSQL diff as substantive, performance-related, or cosmetic. Correct only evidence-backed substantive/index drift in a new Supabase migration. Do not rename indexes cosmetically.
6. Preserve schema.prisma as a derived transitional Prisma Client contract and make Prisma validation/generation plus schema compatibility tests pass.
7. Add automated local tests that: reset a fresh Supabase database through every migration; upgrade a database from the original seven migrations through the recovered/current state; insert and query representative identity, resident, FeePlan, finance, workforce, ticket, notification, audit, and object-metadata records; and fail on schema/history/client incompatibility.
8. Verify required PostgreSQL extensions are available in local Supabase. Do not silently replace unsupported extensions or constraints.
9. Add migration status, schema diff, lint, tests, API/web builds, and repository secret scanning to the existing verification workflow without committing generated services, data, logs, or secrets.
10. Document fresh reset, existing-database adoption/history reconciliation, rollback, CI, and known blockers.

Restrictions: no UI changes; no business logic changes beyond migration compatibility; no remote Supabase; no data deletion/reset outside disposable local test databases; no commit, push, merge, force operation, or history rewrite.

Acceptance: fresh and seven-to-current tests pass; all ten recovered/current migrations have matching checksums; Supabase is the sole future migration authority; Prisma Client remains compatible; every remaining diff is explicitly justified; no secret or remote resource exists; NestJS remains operational.

Report root cause, exact files, migration/checksum mapping, drift decisions, fresh/upgrade results, extension results, tests/builds/secret scan, Git status, rollback, and whether S1 is ready for review. Stop before S2.
```

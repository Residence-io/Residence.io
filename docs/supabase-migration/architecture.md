# Supabase Migration Phase S0 — Architecture and readiness

## Status and scope

This document is an analysis-only plan based on the current TypeScript system at commit `1aeb407752e4ee46f65936e57c1795119504afa4`. No Supabase project, schema, data, authentication account, object, application code, or deployment is changed in Phase S0.

The inspected system contains 105 Prisma models, 19 NestJS controllers, 173 decorated HTTP operations, PostgreSQL migrations for Phases 1–7 plus three recovered resident migrations, and Next.js administration, resident, and anonymous-verification routes. NestJS must stay operational until each bounded replacement passes authenticated functional, RLS, database, and reload-persistence tests.

## Recommended target architecture

| Concern                                | Final owner                           | Rule                                                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web application                        | Next.js App Router                    | Uses `@supabase/ssr`; no privileged key in browser or public server bundle.                                                                                                                               |
| Identity and sessions                  | Supabase Auth                         | `auth.users.id` is the authentication identity. Existing `user_account` becomes the application profile and membership anchor.                                                                            |
| Authorization                          | PostgreSQL RLS plus membership tables | `user_role`, `role_permission`, and society membership remain authoritative. JWT claims are a cache/hint, never the only authorization source for sensitive writes.                                       |
| Simple CRUD                            | Supabase Data API                     | Allowed only on explicitly exposed tables/views with RLS, column grants, bounded queries, and safe projections.                                                                                           |
| Transactional domain operations        | PostgreSQL RPC                        | `SECURITY DEFINER` only when necessary, fixed `search_path`, explicit caller checks, idempotency keys, transactions, audit, and minimal `EXECUTE` grants.                                                 |
| Provider-facing or secret-bearing work | Edge Functions                        | Payment/notification callbacks, email/SMS adapters, signed URL orchestration, and small PDF generation jobs. Service-role access is limited to function secrets and never reaches the browser.            |
| Invariants and event capture           | Constraints and triggers              | Immutable ledger enforcement, outbox insertion, history capture, and denormalized counters where transactionally necessary.                                                                               |
| Durable asynchronous work              | Supabase Queues (`pgmq`) plus Cron    | Logged queues, visibility timeouts, idempotent consumers, retry/dead-letter policy, and monitored Cron dispatch.                                                                                          |
| Files                                  | Private Supabase Storage buckets      | Database metadata remains authoritative; object paths are opaque and society-scoped; RLS protects `storage.objects`.                                                                                      |
| Database delivery                      | Supabase CLI SQL migrations           | One ordered history under `supabase/migrations`; Prisma stops owning migrations after the verified baseline conversion. Generated Supabase TypeScript types replace Prisma client types domain by domain. |

Official constraints used in this design:

- RLS is mandatory for browser Data API access; service-role/secret keys bypass RLS and must never be exposed: <https://supabase.com/docs/guides/database/secure-data>
- Storage access is controlled through policies on `storage.objects`: <https://supabase.com/docs/guides/storage/security/access-control>
- Edge Functions currently have 256 MB memory, 2 seconds CPU per request, and bounded wall-clock duration, so they are not a general-purpose batch worker: <https://supabase.com/docs/guides/functions/limits>
- Supabase Cron uses `pg_cron`; Supabase Queues uses durable Postgres `pgmq`: <https://supabase.com/docs/guides/cron> and <https://supabase.com/docs/guides/queues>

## Current domain inventory

The 105 models fall into these authorization boundaries:

1. **Identity/access:** `Society`, `UserAccount`, `Role`, `Permission`, `RolePermission`, `UserRole`, `UserSession`, `PasswordResetToken`, `SystemSetting`, `AuditLog`, `OutboxEvent`.
2. **Residents/property:** `Property`, `Unit`, `Resident`, `ResidentOccupancy`, `HouseholdMember`, `Vehicle`, `ResidentDocument`, `ResidentFeeAssignment`, `ResidentIDCard`, and sequence models.
3. **Finance:** fee plans/components, late-fee rules, billing periods/batches, dues/line items, immutable ledger, payments/allocations/proofs/provider transactions, adjustments/waivers/reversals/refunds/credit, receipts and sequences.
4. **Workforce:** departments/job titles, staff/employment/status/documents, salary structures/periods/records/payments/adjustments/slips/sequences, contractors, worker categories/skills/availability/reservations/rates/documents/performance/status and sequences.
5. **Tickets:** complaint and maintenance categories, tickets/messages/attachments/history/assignments/appointments/resolutions/ratings, SLA policies, escalations, and disclosure logs.
6. **Notifications:** templates/versions, batches, notifications/recipients/deliveries/attempts/provider references/preferences/history/schedules, announcements/audiences/snapshots/attachments, callback events, and job claims.
7. **Phase 7:** effective-dated financial settings and profile-correction requests.

Most top-level aggregates carry `society_id`. Child rows commonly inherit society through a parent relation. RLS helper functions must resolve that ancestry without trusting client-supplied society IDs.

## Boundary decisions

### Direct Data API

Use for safe, bounded reads and straightforward owner-scoped updates: own profile safe projection, own notification inbox/read status/preferences, reference-data lists, resident-owned complaint/maintenance drafts, and administration lists through safe views. Sensitive encrypted values, storage keys, provider responses, internal notes, ledger internals, and unrestricted audit metadata are never directly exposed.

### PostgreSQL RPC

Use for multi-row or invariant-heavy operations: resident registration and occupancy transitions; atomic identifiers; due generation and late fees; payment confirmation/allocation/refund/reversal; salary generation/payment/reversal; worker reservation; ticket transitions/assignment/appointment/resolution; account-role safety checks; notification audience snapshots; and append-only audit/outbox writes.

### Edge Functions

Use when a secret, provider SDK, binary generation, callback verification, or privileged Storage operation is required. Functions validate the Supabase JWT, call a narrow RPC, and avoid embedding domain transactions in JavaScript when PostgreSQL can enforce them atomically.

### Triggers and queues

Keep immutable-ledger triggers. Add narrowly scoped triggers for audit/outbox capture only where actor context is reliably supplied. Use logged `pgmq` queues for notifications and binary/report jobs; Cron only enqueues work and performs small database maintenance. Consumers must be idempotent and checkpoint progress.

## Workloads and platform fit

| Workload                                              | Supabase-native design                                                                                                            | Blocker/limit                                                                                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID card, receipt, salary slip, vehicle sticker PDF/QR | Edge Function for one small document; write to private Storage; finalize metadata through RPC. Queue larger batches.              | Verify `pdf-lib`/QR bundle, memory, CPU, fonts, logo sizes, and deterministic output. Bulk generation cannot run in one request.                    |
| CSV export                                            | Keyset-paginated read through RPC/view; stream chunks from Edge Function or Next.js server route during transition.               | Edge CPU/wall-clock limits and Data API row limits make unbounded exports unsafe. A durable external worker may be required for very large exports. |
| Notification batches                                  | RPC snapshots audience and enqueues per-recipient messages; Cron/Edge consumer leases logged queue messages and records attempts. | Provider rate limits and Edge duration require small batches and resumption. SMTP ports 25/587 are unavailable; use HTTPS provider APIs.            |
| Scheduled reminders/escalations                       | Cron calls a short idempotent enqueue RPC; queue consumers deliver.                                                               | Cron jobs should remain short and concurrency-limited.                                                                                              |
| Provider callbacks                                    | Edge Function validates raw-body signature and idempotency, then calls RPC.                                                       | Provider-specific crypto/runtime compatibility must be proven.                                                                                      |
| Backup/recovery                                       | Supabase managed backups plus tested CLI/`pg_dump` restore procedure outside Edge Functions.                                      | Edge Functions are unsuitable. RPO/RTO and PITR depend on selected plan.                                                                            |
| Large imports                                         | Offline controlled importer using direct database connection and staging tables; reconcile before cutover.                        | Not safe in browser/Data API or a single Edge invocation.                                                                                           |

## Transition controls

- One domain has one write owner at a time. No uncontrolled dual-write.
- During shadow-read phases, NestJS remains authoritative and discrepancies are logged without changing responses.
- Every cutover has a feature flag, pre-cutover backup, migration checkpoint, reconciliation query, and rollback to the previous NestJS route.
- A NestJS module is removed only after its Supabase replacement passes role-matrix tests, cross-society denial, owner isolation, transactional invariants, object authorization, browser workflow, refresh/reload persistence, and rollback rehearsal.
- Phase S0 does not resolve schema drift. S1 must classify every diff as substantive or cosmetic and add only evidence-backed SQL.

## Readiness conclusion

The system is a viable Supabase migration candidate, but it is not ready for production cutover. Blocking readiness work includes authoritative migration conversion, RLS coverage for all exposed relations, Auth account migration rehearsal, object inventory/reconciliation, index/constraint drift resolution, queue/provider prototypes, and staging-scale performance and recovery tests.

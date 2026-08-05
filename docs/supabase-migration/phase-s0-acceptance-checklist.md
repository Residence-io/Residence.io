# Phase S0 acceptance checklist

## Repository evidence

- [x] Current branch, commit, worktree dirtiness, recovered migrations, and existing S0 drafts were inspected without changing Git history.
- [x] All 105 Prisma models were inventoried and grouped by authorization boundary.
- [x] All 19 NestJS controllers and their endpoint families were mapped.
- [x] Authentication, sessions, CSRF, roles, permissions, account lifecycle, and audit behavior were inspected.
- [x] Resident/property, finance, workforce/payroll, complaints/maintenance, notifications, reports/exports, Storage metadata, PDF/QR generation, outbox, and background processing were inspected.
- [x] No vehicle-sticker backend model or endpoint was found; the gap is recorded rather than assumed complete.

## Architecture decisions

- [x] Next.js remains the web application and NestJS remains operational during migration.
- [x] Supabase Auth is the final identity/session authority.
- [x] PostgreSQL RLS plus application membership tables are the final authorization authority.
- [x] Direct Data API access is limited to safe projections and simple owner/society-scoped operations.
- [x] Transactional and invariant-heavy work uses guarded PostgreSQL RPCs.
- [x] Provider secrets, callback validation, privileged Storage operations, and bounded binary work use Edge Functions.
- [x] Durable asynchronous delivery uses logged queues and short Cron dispatchers.
- [x] Private objects use Supabase Storage with database metadata, immutable keys, signed access, and reconciliation.
- [x] `supabase/migrations` becomes the sole future migration authority in S1; Prisma migrations become historical and Prisma schema remains a transitional derived contract.

## Security design

- [x] Society administrator, resident owner, staff/worker, platform super administrator, anonymous QR, and cross-society policy patterns are defined.
- [x] Child-table society ancestry and safe-view column restrictions are defined.
- [x] Service-role usage is excluded from browsers and normal user requests.
- [x] Storage bucket policies, signed URL constraints, and missing/orphan object behavior are defined.
- [x] `SECURITY DEFINER`, JWT claim staleness, append-only audit/ledger, and privilege escalation controls are defined.
- [x] Real JWT RLS tests—not database-owner-only tests—are required.

## Authentication decision

- [x] Existing Argon2id handling was inspected.
- [x] Official Supabase support for Argon2 password-hash import was identified.
- [x] Hash import is conditional on a parameter-compatible local/staging rehearsal.
- [x] Forced reset is the per-account fallback for unsupported/malformed hashes, not an automatic blanket policy.
- [x] Username compatibility, Auth ID mapping, role source of truth, stale claims, session revocation, and rollback are designed.

## Migration and workload readiness

- [x] Fresh deployment and original-seven-to-current upgrade tests are required in S1.
- [x] Remaining substantive versus cosmetic index/constraint drift has an evidence-based disposition process.
- [x] PDF/QR, CSV, notification batch, reminder, callback, backup, and large-import platform fit is documented.
- [x] Edge limits are treated as constraints; bulk/backup/import work is not placed in one invocation.
- [x] Every S1–S9 phase includes an exit gate and rollback approach.
- [x] An exact bounded S1 implementation prompt is provided.

## Required deliverables

- [x] `architecture.md`
- [x] `backend-replacement-matrix.md`
- [x] `rls-design.md`
- [x] `auth-migration.md`
- [x] `data-storage-migration.md`
- [x] `phased-roadmap.md`
- [x] `risk-register.md`
- [x] `phase-s0-acceptance-checklist.md`

## Non-action confirmation

- [x] No application source code or UI was changed for S0.
- [x] No Prisma/Supabase migration was created or executed for S0.
- [x] No database data, object, Auth user, Supabase project, hosting resource, or credential was created/modified/deleted.
- [x] No environment file, generated client, dependency, build artifact, private document, or secret was added.
- [x] No commit, push, merge, reset, rebase, checkout, or history rewrite occurred.
- [x] Existing uncommitted work remains preserved.

## S0 result

Phase S0 is ready for review when documentation lint/scope checks and the final Git/secret scan confirm that only the eight planning documents changed in this phase. Phase S1 must not begin without separate approval.

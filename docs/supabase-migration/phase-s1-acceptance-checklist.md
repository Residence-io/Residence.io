# Phase S1 acceptance checklist

- [x] Supabase CLI is pinned and invoked from repository scripts.
- [x] Local Supabase starts without a remote login or linked project.
- [x] All ten historical migrations match their authoritative Prisma copies by SHA-256.
- [x] Both additive Phase S1 migrations apply on a fresh local Supabase PostgreSQL 17 database.
- [x] Two consecutive local resets succeed.
- [x] Migration history lists all twelve checked-in Supabase migrations.
- [x] Generated TypeScript database types are current.
- [x] Every application table has RLS enabled with no permissive S1 policy.
- [x] `anon` and `authenticated` have no application-table grants.
- [x] Only the deliberately empty `api` schema is exposed by the Data API.
- [x] NestJS/Prisma application and schema compatibility tests pass.
- [x] FeePlan queries do not request a nonexistent `property_id` column.
- [x] Formatting, lint, type checks, tests, builds, and secret scan pass.
- [x] No remote project, credentials, runtime data, deployment, commit, push, or merge occurred.
- [x] Supabase Auth migration and complete RLS policy implementation remain deferred to later reviewed phases.

Known non-blocking baseline: `npm audit --audit-level=critical` passes with no critical advisory, while reporting 5 high and 8 moderate transitive/application advisories that require a separately reviewed dependency update.

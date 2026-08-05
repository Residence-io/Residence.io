# Phase S1 verification

## Required local verification

1. Start the pinned local stack with `npm run supabase:start`.
2. Run `npm run supabase:reset` twice.
3. Run `npm run supabase:check`.
4. Run Prisma format validation, schema validation, and client generation.
5. Run the database compatibility suite with `RUN_DATABASE_TESTS=true`.
6. Run formatting, lint, type checks, unit tests, builds, and `npm run security:scan`.

`supabase:verify` checks historical migration hashes, the pinned CLI's supported PostgreSQL 17 runtime, required extensions, all twelve migration versions, RLS on every application table, absence of browser-role table grants, the restricted API schema, the FeePlan compatibility condition, the Phase S1 indexes, and the immutable financial-ledger trigger. It never prints the local database URL or generated local keys.

Generated types live at `packages/shared/src/supabase/database.types.ts`. CI regenerates them from a fresh local database and fails when the tracked file differs.

## Exact Phase S2 implementation prompt

> Implement Phase S2 of the Residence.io Supabase migration: authentication and identity mapping. Continue from the reviewed Phase S1 local foundation. Keep NestJS as the application API and authorization boundary while introducing a reversible mapping between Supabase Auth identities and the existing `user_account` records. Preserve all existing users, roles, permissions, sessions, password-reset behavior, society isolation, audits, and application features. Do not migrate production data, link or deploy a remote Supabase project, expose service-role credentials to browsers, weaken RBAC, or implement broad RLS policies. Add only the schema, migration, backend adapter, account-linking workflow, tests, local Supabase verification, generated types, CI, and documentation required for identity compatibility. Prove existing credential login remains available during the transition, duplicate identity linkage is prevented, suspended users remain denied, the last-super-admin protection remains intact, and no plaintext password or token is stored or logged. Stop after Phase S2 verification; do not begin Storage, Realtime, or direct browser database access.

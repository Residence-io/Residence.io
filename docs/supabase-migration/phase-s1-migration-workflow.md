# Phase S1 migration workflow

## Authority

Beginning with Phase S1, `supabase/migrations` is the deployment source of truth. `apps/api/prisma/migrations` remains the immutable historical archive used by the existing Prisma regression tests.

The ten historical SQL files were copied byte-for-byte. `supabase/migration-manifest.json` records their source, destination, version, and SHA-256 checksum. `npm run supabase:verify` fails if a historical copy changes.

New database changes must be additive, reviewed SQL files under `supabase/migrations`. Do not edit the historical ten files. Keep `apps/api/prisma/schema.prisma` aligned for Prisma Client generation, but do not use `prisma db push` or `prisma migrate dev` as a substitute for reviewed Supabase migrations.

## Phase S1 additions

- `20260801000000_phase_s1_supabase_foundation.sql` creates a deliberately empty API schema, removes browser-role access to application objects, and enables RLS without policies on every existing application table.
- `20260801001000_phase_s1_substantive_indexes.sql` adds two indexes required by current complaint and worker-assignment query shapes.

RLS has no allow policies in S1. Consequently, `anon` and `authenticated` have no direct application-table access. The existing trusted NestJS database owner connection remains the only application data path. Full RLS policy design is deferred until identity and authorization semantics are migrated.

## Reset and drift checks

Run `npm run supabase:reset` twice, then `npm run supabase:check`. A second reset proves that the complete checked-in migration chain is reproducible. Prisma validation and the PostgreSQL schema compatibility tests must also pass before review.

Cosmetic database/Prisma index-name differences are not rewritten in S1. Only evidence-backed structural incompatibilities are changed.

# Phase 2 verification

Verification must run these commands after dependency installation:

```text
npm run format:check
npm run lint
npm run typecheck
npm run prisma:validate
npm run prisma:generate
npm test
npm run test:e2e --workspace api
npm run build
```

The optional PostgreSQL migration/integrity suite is enabled with `RUN_DATABASE_TESTS=true npm run test:e2e --workspace api`. It starts PostgreSQL through Testcontainers, applies Phase 1 and Phase 2 SQL, verifies the Phase 2 tables, and exercises concurrent sequence allocation. It must remain skipped when Docker is unavailable; an in-memory database is not substituted.

Coverage includes identity encryption/search hashing, owner versus tenant validation, concurrent resident-number allocation, file signature/size/path validation, PDF generation, safe/revoked card verification, the Phase 2 PostgreSQL migration, and the resident registration form. Phase 1 tests remain part of the repository-wide test run.

## Verified results (2026-07-14)

- `npm ci --prefer-offline --no-audit`: passed using the committed npm lockfile.
- Prisma validation and Prisma Client generation: passed with Prisma 7.8.0.
- Repository formatting check, ESLint, and TypeScript checks: passed. ESLint retains two non-failing Phase 1 Supertest typing warnings.
- API unit tests: 9 suites, 14 tests passed.
- Frontend tests: 3 files, 6 tests passed.
- API non-database end-to-end tests: 2 passed.
- Shared package, NestJS API, and Next.js production builds: passed. The Next.js route manifest includes all Phase 2 admin, resident-profile, and verification routes.

Docker and `psql` are not installed on this workstation. The two database suites were discovered and explicitly skipped (3 tests); `RUN_DATABASE_TESTS=true npm run test:e2e --workspace api` and actual `prisma migrate deploy` were not run. No in-memory substitute was used and no successful PostgreSQL migration execution is claimed.

Known deployment limitations are production object storage, malware scanning, card logo/signatory administration, and actual invitation notification delivery; all remain outside Phase 2 or behind existing boundaries.

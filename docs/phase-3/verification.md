# Phase 3 verification

Static and non-database verification covers Prisma schema validation/generation, formatting, ESLint, TypeScript, unit tests, safe API tests, Next.js and NestJS production builds, and secret scanning. Phase 3 tests cover decimal rounding, late-fee calculation, due status, oldest-first/partial/advance allocation, DTO validation, sandbox safety and signatures, and server-generated receipt PDFs. The safe suites contain 41 passing tests; API e2e adds two passing non-database checks and skips seven PostgreSQL-dependent checks across three suites.

`phase3-database.e2e-spec.ts` applies all three migrations to PostgreSQL 16 and verifies financial tables, resident-period uniqueness, immutable ledger enforcement, and concurrent receipt sequences when `RUN_DATABASE_TESTS=true`.

Docker, PostgreSQL, `psql`, and npm CLI are unavailable in the current execution environment. Existing dependencies are used directly. Database migration execution and database-backed tests must remain skipped and must not be reported as passing until a PostgreSQL or Docker runtime is available.

Known limitation: the online adapter is deliberately a development/test sandbox and never represents real provider delivery. Phase 6 notification delivery is not implemented; Phase 3 only persists outbox events.

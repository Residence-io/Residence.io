# Phase 5 verification

Verification includes Prisma schema validation/client generation, formatting, ESLint, TypeScript, workflow/DTO/unit tests, existing API/frontend regressions, API integration checks, and production builds.

PostgreSQL migration, sequence concurrency, and exclusion-constraint execution use Testcontainers and remain explicitly skipped when Docker/PostgreSQL is unavailable. No in-memory database is substituted and no unknown database is contacted.

The final staged diff is checked for secrets, environment files, private attachments, storage contents, generated builds, logs, coverage, and local databases before commit.

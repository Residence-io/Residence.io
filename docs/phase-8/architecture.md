# Phase 8 production-readiness architecture

Phase 8 preserves the Phase 1–7 domain architecture and adds operational boundaries rather than new business features.

## Runtime boundaries

- The Next.js container serves standalone web output and calls only the versioned NestJS API.
- NestJS listens on all container interfaces, enables graceful shutdown hooks, uses bounded HTTP timeouts, trusted-proxy configuration, Helmet, strict CORS, DTO validation, CSRF/session guards, and configurable throttling.
- PostgreSQL 16 remains the sole database. Migrations are forward-only and run as a separate controlled operation before application rollout.
- Private documents live in a non-public mounted directory. Startup creates and verifies the root; object keys remain randomized and traversal-safe.
- Liveness proves the process is responsive. Readiness requires a database query; storage has already been verified during application initialization.

## Configuration and secrets

`.env.example` contains names and non-secret defaults only. Required secrets are blank and must be generated locally or injected from a production secret manager. Validation fails fast for missing values, insecure production cookies, development seeding, sandbox providers, public storage paths, and recognizable placeholder secrets.

No live SMTP, SMS, or payment provider is selected by this phase. Sandbox modes are explicit and rejected in production. Production can start with providers disabled; enabling live delivery requires reviewed provider adapters, credentials from a secret manager, callback allow-listing/signature verification, timeouts, and provider-specific monitoring.

## Logging and observability

The API emits structured JSON with timestamps, levels, and contexts. Nested credential-like fields are redacted. Correlation IDs are preserved by middleware and returned in safe errors. Health endpoints expose no database URLs, storage paths, tokens, or provider credentials. Production operators should collect stdout/stderr, alert on readiness failures and failed notification batches, and define retention outside the application.

## Containers and CI

The containers pin Node 24.14.0, install from `package-lock.json`, build as separate stages, and run as the unprivileged `node` user. Compose provides persistent database and private-storage volumes. CI uses ephemeral secrets, PostgreSQL 16, clean migrations, two seed runs, tests, builds, and a high-confidence secret scan. It does not deploy.

No Phase 8 Prisma migration is needed: the audit found no new persistence requirement or missing constraint for these operational changes, so all applied Phase 1–7 migrations remain byte-for-byte unchanged.

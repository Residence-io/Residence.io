# Phase 8 acceptance checklist

- [x] Node and npm versions are pinned and enforced.
- [x] A safe environment template and fail-fast production validation exist.
- [x] Development seed is idempotent, production-disabled, and supplies linked review personas without committed passwords.
- [x] Migration creation, deployment, reset, and seed commands are clearly separated.
- [x] Existing Phase 1–7 migrations are unchanged; no unnecessary Phase 8 schema change was added.
- [x] Liveness, database readiness, and safe provider-status endpoints exist.
- [x] Graceful shutdown, request timeouts, proxy handling, throttling, structured redacted logs, CORS, Helmet, sessions, CSRF, and existing RBAC are preserved.
- [x] Private storage is non-public and verified at startup.
- [x] Sandbox notification and payment providers cannot run in production.
- [x] Offline-compatible web builds and standalone container output are configured.
- [x] Non-root API/web Dockerfiles and PostgreSQL/full-stack Compose files exist.
- [x] CI performs installation, dependency audit, Prisma checks, migrations, repeated seeding, tests, builds, runtime smoke tests, and secret scanning without deploying.
- [x] Fresh-database schema coverage and API health smoke coverage are implemented.
- [x] Windows setup, backup/restore, rollback, rotation, incident, and retention guidance exists.
- [ ] Live email, SMS, and payment delivery require provider selection, implementation, credentials, and external acceptance testing.
- [ ] Database/Testcontainers and Docker image execution must be run where Docker/PostgreSQL are available.
- [ ] External hosting, TLS termination, DNS, managed backups, monitoring, and deployment remain operator responsibilities and were not performed.

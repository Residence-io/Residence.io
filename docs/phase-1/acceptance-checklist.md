# Phase 1 acceptance checklist

- [x] npm/Turborepo TypeScript workspace and supported Node version declared
- [x] Next.js, React, NestJS, Prisma 7, and PostgreSQL responsibilities separated
- [x] Normalized Phase 1 Prisma schema and forward-only initial migration
- [x] Typed startup configuration rejects missing required values
- [x] Argon2id password hashing, generic login failures, lockout, reset, and forced change
- [x] Opaque database-backed sessions, expiry, revocation, secure cookie policy, and CSRF checks
- [x] NestJS role and permission guards with society/ownership context foundation
- [x] Versioned API, DTO validation, standard errors, correlation IDs, throttling, CORS, and Swagger
- [x] Audit foundation and authentication/security events
- [x] Idempotent, development-only society/role/user seed
- [x] Real public account routes and protected administration/resident shells
- [x] Later-phase navigation disabled and fake business metrics excluded
- [x] Architecture and setup documentation matches TypeScript implementation
- [x] `npm ci`, Prisma validation/generation, tests, type checks, lint, and builds verified
- [ ] PostgreSQL migration execution verified against a dedicated database
- [ ] Docker-dependent integration tests verified where Docker is available (Docker unavailable on this workstation)

Phases 2–6 remain pending.

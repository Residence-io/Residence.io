# Phase 1 TypeScript architecture

## Boundaries

Residence.io is an npm/Turborepo monorepo. `apps/web` owns the Next.js App Router pages, accessible React components, role-aware navigation, and calls to the NestJS API. `apps/api` owns configuration, authentication, authorization, validation, Prisma access, audit logging, health checks, and all authoritative behavior. `packages/shared` contains only safe role/permission constants and transport contracts.

PostgreSQL is the only datastore. Prisma migrations are forward-only and Prisma Client is generated into an ignored API-local directory. Prisma 7 connection configuration lives in `apps/api/prisma.config.ts`, while runtime connections use the PostgreSQL driver adapter.

## Authentication

- Argon2id hashes passwords with configurable minimum-safe memory and time costs.
- Login accepts a normalized username or email and returns generic failures.
- Failed attempts trigger a configurable temporary lock.
- Sessions use 256-bit opaque tokens. Only keyed hashes are stored in `user_session`.
- The session cookie is HttpOnly, SameSite Strict, and Secure in production.
- A separate CSRF token is verified against the session hash for authenticated state changes.
- Logout, password reset, password change, or explicit session actions revoke database sessions.
- Reset tokens are random, hashed at rest, expiring, and consumed once.
- Temporary-password accounts cannot use normal protected endpoints until the password changes.

External reset delivery is represented by an outbox event; a provider dispatcher is intentionally deferred. Passwords, cookie values, and tokens are never placed in application or audit logs.

## Authorization

Every protected API request passes session, role, permission, and CSRF guards. Initial roles are Super Administrator, Administrator, Accounts Manager, Maintenance Manager, and Resident. Role and permission metadata is enforced in NestJS, independently of frontend visibility. Every request user carries a society boundary for future record-ownership policies.

The frontend layouts repeat coarse route checks for user experience, but those checks are not treated as security controls.

## Operational foundation

Environment variables are parsed and validated before startup; invalid configuration reports variable names without values. Helmet, strict CORS, DTO whitelisting, throttling, response serialization, correlation IDs, and a production-safe error envelope are enabled globally. Liveness and database readiness endpoints are exposed under `/api/v1/health`.

The audit service stores actor, society, action, target, outcome, reason, safe metadata, source IP, correlation ID, and time. Audit and outbox tables are append-oriented foundations for later phases.

## Phase boundaries

Resident management, billing, workforce, complaints, maintenance, and notification campaigns are not implemented in Phase 1. Their navigation items are disabled and dashboards do not display invented data.

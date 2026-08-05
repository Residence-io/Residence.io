# Phase 1 local setup

## Prerequisites

- Node.js 24 (the supported range is declared in `package.json` and `.node-version`)
- npm 11
- PostgreSQL 16 or newer
- Docker only for the optional containerized database integration suite

## Required configuration

Set these through the shell, deployment secret manager, or an ignored local `.env` file. No credential-bearing environment file belongs in Git.

| Variable                  | Purpose                                                  | Development example                                          |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`            | Direct PostgreSQL connection used by Prisma CLI and API  | `postgresql://residence:local-only@localhost:5432/residence` |
| `SESSION_SECRET`          | Keyed session/CSRF token hashing; at least 32 characters | generate a unique random value                               |
| `WEB_ORIGIN`              | Sole browser origin allowed by CORS                      | `http://localhost:3000`                                      |
| `API_PORT`                | NestJS port                                              | `3001`                                                       |
| `SESSION_COOKIE_SECURE`   | Require HTTPS cookies                                    | `false` locally; `true` in production                        |
| `RESIDENCE_SEED_PASSWORD` | Local seed password                                      | choose a local-only value                                    |

Optional controls include `SESSION_COOKIE_NAME`, `SESSION_TTL_MINUTES`, `ARGON2_MEMORY_COST`, `ARGON2_TIME_COST`, `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCK_MINUTES`, `PASSWORD_RESET_TTL_MINUTES`, `LOG_LEVEL`, and `RESIDENCE_SEED_ENABLED`.

The web application uses `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:3001/api/v1`. This value is an endpoint, not a secret.

## Install and run

```text
npm ci
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`db:migrate` runs `prisma migrate deploy`; do not use `prisma db push` as a production migration process. Run migration and seed commands only against a database you own.

## Development seed

Seeding is explicit, idempotent, and refuses to run with `NODE_ENV=production`. It creates the demo society, permission catalogue, five approved roles, a `superadmin` account, and a `resident` account. Both use `RESIDENCE_SEED_PASSWORD`; the resident must change it on first login. Never reuse this password outside development.

## Routes

Web: `/login`, `/forgot-password`, `/reset-password`, `/change-password`, `/unauthorized`, `/admin/dashboard`, and `/resident/dashboard`.

API: `/api/v1/auth/*`, `/api/v1/users/*`, `/api/v1/societies/current`, `/api/v1/settings`, `/api/v1/health/live`, and `/api/v1/health/ready`.

# Phase 8 operations guide

## Windows local setup

Use PowerShell from the repository root:

```powershell
Copy-Item .env.example .env
# Edit .env and supply local-only database and random secret values.
npm ci
npm run prisma:validate
npm run prisma:generate
docker compose -f compose.postgres.yml up -d
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Do not run migration, reset, or seed commands until `DATABASE_URL` is confirmed as a dedicated database you control. `npm run db:reset` is destructive and is for disposable local databases only. The API and web default to ports 3001 and 3000.

## Full Compose stack

After completing `.env`:

```powershell
docker compose build
docker compose --profile operations run --rm migrate
# For local demo data, run npm run db:seed from the trusted host environment.
docker compose up -d
docker compose ps
```

Application startup never auto-applies migrations. Check `/api/v1/health/live`, `/api/v1/health/ready`, and `/api/v1/health/configuration` before routing traffic.

## Backup and restore

Create encrypted, access-controlled backups outside the repository. One PostgreSQL example is `pg_dump --format=custom --file residence.dump "$env:DATABASE_URL"`. Restore only into a new or explicitly approved empty database with `pg_restore --clean --if-exists --no-owner --dbname <target> residence.dump`, then validate row counts, constraints, permissions, health, and representative workflows. Never test restores against production.

Back up the private-storage volume consistently with its database metadata. A database restore without matching private objects leaves document records unavailable. Define retention for documents, backups, audit logs, and provider delivery logs according to policy and law.

## Release and rollback

1. Back up and test restoration.
2. Build immutable images from a reviewed commit and scan them.
3. Run `prisma migrate deploy` as a controlled one-off task.
4. Start the API, verify readiness, then start or update the web service.
5. Run login, RBAC, resident, payment, maintenance, notification, reports, and document smoke checks.

Prisma migrations are forward-only. Roll back application images only when the prior version is compatible with the new schema. For an incompatible migration, stop writes and restore the verified pre-release database and private-storage backup; do not improvise destructive SQL.

## Secret rotation

- Rotate provider and database credentials through the hosting secret manager, restart affected services, and verify health/callbacks.
- Rotating `SESSION_SECRET` invalidates sessions; schedule it and communicate the forced re-login.
- `IDENTITY_DATA_KEY` protects encrypted identity data and needs a separately designed data re-encryption procedure before rotation. Never replace it blindly.
- Revoke exposed credentials immediately, inspect audit/provider logs, and invalidate related sessions or callback secrets.

## Incident basics

For readiness failure, remove the instance from traffic, inspect correlation-aware structured logs, check PostgreSQL and private-volume permissions, and avoid logging secret configuration. For suspected data exposure, preserve evidence, restrict access, rotate affected credentials, notify the project owner, and follow applicable breach policy. Notification/email/SMS/payment providers remain disabled in production until explicitly integrated and reviewed.

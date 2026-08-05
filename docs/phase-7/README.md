# Phase 7 — Settings, reports, dashboards, and profile completion

## Architecture

Phase 7 extends the existing NestJS modules, Prisma client, App Router shells, RBAC guards, audit log, private storage, and Phase 1–6 services. It does not introduce another application framework or data-access path.

- `SettingsModule` stores non-secret society, resident/document, maintenance, notification, and security-policy sections as versioned `SystemSetting` records. Updating a section archives the previous row and writes an audit event.
- `FinancialSettingPeriod` stores effective-dated calculation policy. The service uses a serializable transaction, rejects overlapping active periods, and never updates historical dues, ledgers, payments, or receipts.
- `AdministrationModule` provides society-scoped user lifecycle, role/permission, audit viewer, report, dashboard, account-security, and profile-correction APIs.
- `ProfileCorrectionRequest` lets residents request protected identity, tenancy, or occupancy corrections without granting direct write access.
- Reports are allow-listed, paginated, filtered, and society-scoped. CSV export is bounded to 5,000 rows, audited, and neutralizes cells beginning with `=`, `+`, `-`, or `@`.

## Authorization

All administrative routes require existing session authentication plus explicit NestJS permission guards. Services repeat society-scoping and record checks. New permissions are:

- `REPORT_READ`
- `REPORT_EXPORT`
- `PROFILE_CORRECTION_MANAGE`

Only a super administrator can change role-permission grants or assign the super-administrator role. Account status and role updates use optimistic versions and prevent removal or suspension of the last active super administrator. Password hashes, reset-token hashes, session tokens, provider credentials, identity values, and banking values are never selected by these APIs.

## API routes

- `GET|PUT /api/v1/settings/sections/:section`
- `GET|POST /api/v1/settings/financial`
- `DELETE /api/v1/settings/financial/:id`
- `GET /api/v1/administration/users`
- `PATCH /api/v1/administration/users/:id/status`
- `PATCH /api/v1/administration/users/:id/roles`
- `POST /api/v1/administration/users/:id/force-password-reset`
- `POST /api/v1/administration/users/:id/revoke-sessions`
- `GET /api/v1/administration/roles`
- `GET /api/v1/administration/permissions`
- `PATCH /api/v1/administration/roles/:id/permissions`
- `GET /api/v1/administration/audit-logs`
- `GET|PATCH /api/v1/administration/correction-requests`
- `GET|POST /api/v1/profile/me/correction-requests`
- `GET /api/v1/profile/me/security`
- `GET /api/v1/reports`
- `GET /api/v1/reports/:report`
- `GET /api/v1/reports/:report.csv`
- `GET /api/v1/reports/dashboard/admin`
- `GET /api/v1/reports/dashboard/me`

## Web routes

Administration: `/admin/settings`, its society/financial/residents/maintenance/notifications/security subpages, `/admin/users`, `/admin/roles`, `/admin/reports`, `/admin/reports/[report]`, and `/admin/audit-logs`.

Resident: `/resident/profile`, `/resident/profile/security`, and the completed `/resident/dashboard`.

## Reports

The catalog includes resident directory/status, occupancy/vacancy, dues, aging, payments, payment-method detail, adjustments/reversals, receipts, credits, staff/workers, salaries, complaints, maintenance, worker workload, SLA exceptions, notification delivery/failures, and audit activity. All records come from the Phase 1–6 tables; no placeholder rows are generated.

## Migration and seed

Apply `20260720120000_phase_7_settings_reports` only through the normal PostgreSQL deployment process. The migration is additive. The development seed upserts the new permissions and approved grants; it still requires `DATABASE_URL` and `RESIDENCE_SEED_PASSWORD` and remains disabled in production.

## Environment and production considerations

No new secret environment values are required. Existing database, session, identity-encryption, email, SMS, storage, and public URL variables remain documented in `.env.example`. Provider credentials stay in environment-backed configuration; the settings APIs reject secret-like keys. Sandbox email/SMS modes must not be represented as live delivery.

For production, run migration deployment against the intended PostgreSQL database, execute database-backed integration tests, configure live providers explicitly, review report-export limits, and validate configured time zones/locales. This phase intentionally contains no Phase 8 deployment automation.

## Verification

Run from the repository root:

```text
npm ci
npm run prisma:validate
npm run prisma:generate
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e --workspace api
npm run build
```

Database-backed migration and Testcontainers checks require Docker or a dedicated local PostgreSQL instance. They must be reported as environment-blocked rather than silently replaced with another database.

## Acceptance checklist

- [x] Versioned society and operational settings APIs and pages
- [x] Effective-dated financial settings with overlap protection
- [x] User lifecycle, session revocation, forced reset, role and permission APIs
- [x] Last-super-admin and privilege-escalation protection
- [x] Resident own-profile security and protected-data correction requests
- [x] Real society-scoped reports with filters, pagination, safe CSV, and audit
- [x] Real administration and resident dashboard aggregations
- [x] Searchable, redacted audit viewer
- [x] Additive Prisma schema and migration
- [x] Focused policy, validation, and critical frontend-state tests
- [ ] PostgreSQL migration execution and database-backed tests (environment dependent)
- [ ] Production email/SMS delivery (requires separately configured providers)

## Known limitations

- The report UI renders nested data compactly and exports CSV; dedicated PDF report layouts are deferred because no reliable common report-PDF template exists in Phases 1–6.
- Role-permission mutation is exposed through the secured API; the Phase 7 role page is deliberately read-oriented to make high-risk grants reviewable without encouraging accidental bulk changes.
- Configuration category archival continues to use the existing Phase 4–6 category/SLA endpoints and models rather than duplicating them in settings.
- No deployment, hosting, production secrets, or Phase 8 work is included.

# Phase 2 — Resident management architecture

Phase 2 extends the Phase 1 TypeScript monorepo. Next.js App Router remains the only web frontend, NestJS remains the only API, Prisma remains the only ORM, and PostgreSQL remains the database. Phase 1 authentication, cookie sessions, CSRF, throttling, RBAC, audit records, exception handling, and transactional outbox are reused without changing the Phase 1 migration.

## Domain and persistence

Migration `20260714210000_phase_2_resident_management` adds `property`, `unit`, `resident`, `resident_occupancy`, `household_member`, `vehicle`, `resident_document`, `resident_fee_assignment`, `resident_id_card`, and `resident_id_sequence`. UUID primary keys, society-scoped foreign keys and indexes, archive/status fields, effective dates, PostgreSQL `decimal(19,4)` values, optimistic versions, partial active-row indexes, and restrictive foreign keys preserve history and integrity.

`ResidentIDService` allocates a society/year sequence with one PostgreSQL `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` statement inside the serializable registration transaction. The default `RES-{YEAR}-{SEQUENCE}` format may be overridden by `resident.id.format` in society settings. Existing IDs never change.

Registration atomically validates the unit, rejects an active primary occupancy, optionally creates exactly one Resident-role account, creates the resident and occupancy, snapshots the initial future billing assignment, adds initial household/vehicle records, marks the unit occupied, records audit events, and persists an account-invitation outbox event. Temporary passwords use a cryptographically secure generator, are Argon2id-hashed before the transaction, are returned once, and are never placed in audit or outbox metadata.

## Privacy and authorization

Identity numbers are normalized, AES-256-GCM encrypted with a random IV, and keyed-HMAC indexed for authorized exact search. Ordinary responses contain only the last four characters. Every resident query is society scoped. Residents resolve their profile from the authenticated account link; administrative reads and mutations require granular Phase 2 permissions in both guards and services.

Private files are stored below `PRIVATE_STORAGE_ROOT`, never below Next.js public assets. Object keys are generated UUID paths, path traversal is rejected, PDF/PNG/JPEG signatures and configured size limits are checked, and every download is authorized. Database responses never expose object keys. Production deployments should add malware scanning and an object-storage adapter behind the local storage service.

## ID card

The NestJS backend uses `pdf-lib` to produce a two-page CR80 PDF at 85.60 × 53.98 mm. `qrcode` embeds a URL containing a random opaque token; only its SHA-256 hash is stored. Verification returns validity, display name, resident number, society, unit summary, and expiry only. Generation revokes the previous active card while preserving history. PDF downloads enforce society and record-level authorization.

## API routes

- `POST/GET /api/v1/residents`, `GET/PATCH /api/v1/residents/:id`
- `GET/PATCH /api/v1/residents/me`
- `POST /api/v1/residents/:id/activate|suspend|move-out|archive`
- `POST/PATCH /api/v1/residents/:id/household-members[/ :memberId]`
- `POST/PATCH /api/v1/residents/:id/vehicles[/ :vehicleId]`
- `GET/POST /api/v1/residents/:id/documents`, controlled download and archive routes
- `POST/GET /api/v1/residents/:id/id-card`, plus revoke
- `GET /api/v1/verify/card/:token` (public, token bound, safe projection)
- `GET/POST /api/v1/properties`, `GET /api/v1/properties/:id`, `POST /api/v1/properties/units`

## Next.js routes

- `/admin/residents`, `/admin/residents/new`, `/admin/residents/[id]`, `/admin/residents/[id]/edit`
- `/admin/properties`, `/admin/properties/[id]`
- `/resident/profile`
- `/verify/card/[token]`

The resident directory delegates search, filtering, ordering, and pagination to PostgreSQL. The frontend does not load the resident table to filter in memory.

Phase 3 financial ledgers, dues, payments, and receipts are not implemented. `resident_fee_assignment` contains only the initial effective amount and optional security deposit required for Phase 3.

# Supabase Auth migration

## Current authentication inventory

The NestJS system authenticates normalized username or email against an Argon2id hash in `user_account.password_hash`. Successful login creates a random opaque session and CSRF token; only HMAC digests are stored in `user_session`. Account status, lockout, forced password change, role/permission expansion, password reset, session revocation, and security audit are implemented in NestJS/Prisma.

Supabase Auth will replace credential verification, password reset, refresh/access tokens, and session lifecycle. The application profile, society membership, roles, permissions, resident/staff/worker links, and business status remain in application tables protected by RLS.

## Password decision

The default decision is **import compatible Argon2id hashes**, not a blanket forced reset. Supabase's official [Auth0 migration guide](https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0) documents `auth.admin.createUser({ password_hash })` support for Argon2 and bcrypt hashes. Residence.io already stores standard Argon2id encoded strings.

This support must still be proven locally/staging before migration:

1. Create test users with hashes generated using each Argon2 parameter set found in the real database.
2. Import through the supported Auth Admin API, never by hand-writing `auth.users`.
3. Verify correct password succeeds, incorrect password fails, Auth rehash behavior is acceptable, reset works, and the hash never appears in logs.
4. Inventory malformed, blank, truncated, legacy, or duplicated accounts before batch import.

Any account whose hash fails the compatibility rehearsal is created without a reusable credential, marked `auth_migration_state = RESET_REQUIRED`, and receives a one-time Supabase recovery invitation through an approved channel. Existing hashes are never converted by asking for plaintext and are never copied to browser code. The current `password_reset_token` table becomes historical/read-only after cutover.

## Account mapping

Add migration metadata without re-keying business tables:

| Field/table                         | Purpose                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `user_account.auth_user_id`         | Nullable unique FK to `auth.users.id`; authoritative Auth link after reconciliation                     |
| `user_account.auth_migration_state` | `PENDING`, `IMPORTED`, `RESET_REQUIRED`, `VERIFIED`, or `FAILED`                                        |
| `user_account.auth_migrated_at`     | Operational checkpoint                                                                                  |
| private migration manifest          | Source account ID, target Auth ID, method, result, attempt count, safe error category; no hash or token |

Use the existing contact email when it is valid and globally unique. For accounts without a usable email, S2 must choose and document either verified phone authentication or an internal non-deliverable alias with recovery handled through an administrator. Never silently attach one person's email/phone to another account.

The application `user_account.id` remains the foreign-key target for current domain tables. RLS resolves `auth.uid()` through `auth_user_id`. This avoids rewriting 100+ relationships during Auth cutover and makes rollback possible.

## Username compatibility

Supabase password sign-in is email/phone based; username is not a native credential. Preserve `username` and `normalized_username` in `user_account` for display and search. Use this order of preference:

1. Encourage email/phone sign-in for accounts that have a verified address.
2. For mandatory legacy username sign-in, expose a rate-limited Edge Function that accepts the login identifier over TLS, resolves the normalized username without revealing whether it exists, and delegates credential verification to Supabase Auth. It must return the same generic failure for unknown, suspended, and wrong-password cases.
3. Do not expose a public username-to-email lookup and do not store the password in logs, traces, analytics, or function metadata.

The username bridge is transitional and must be penetration-tested for enumeration, brute force, timing differences, and password leakage. If a safe bridge cannot be proven, S2 must require email/phone sign-in and communicate that product change explicitly.

## Roles, permissions, and claims

`user_role`, `role`, `role_permission`, and `permission` remain authoritative. A Custom Access Token Auth Hook may place a small version or active-society hint in `raw_app_meta_data`, but sensitive RLS checks re-read membership tables. Never trust `raw_user_meta_data`; users can modify it.

- JWTs contain no service role, database password, encryption key, provider credential, or unrestricted permission list.
- Role changes increment a membership version, revoke/refresh sessions as required, and take effect in database checks immediately.
- Last-active-platform-super-admin and privilege-ceiling protections live in guarded RPCs, not the browser.
- Suspended/archived application accounts are rejected by RLS helpers even if an access token has not expired; the Auth user is also banned/revoked through an admin Edge Function.

## Migration sequence

1. **Inventory:** count accounts by status, verified email/phone, duplicate identifiers, role, resident/staff/worker link, and Argon2 parameter signature. Export only safe aggregate results.
2. **Schema preparation:** add Auth link/state fields, FK and indexes through the authoritative Supabase migration history; keep NestJS authentication unchanged.
3. **Compatibility pilot:** import synthetic and selected consented staging fixtures using supported Admin APIs; prove Argon2 behavior.
4. **Dry-run manifest:** produce deterministic source-to-target mappings and classify accounts requiring reset. No production writes.
5. **Batch import:** idempotently create Auth users, link application rows transactionally where possible, and reconcile every row. The service-role key exists only in controlled migration/Edge secrets.
6. **Shadow verification:** NestJS stays authoritative while a non-user-visible verifier checks mapping, status, and role consistency.
7. **Bounded cutover:** move a pilot cohort to Supabase Auth behind a feature flag. Invalidate old NestJS sessions for that cohort only after successful Auth login.
8. **Expand:** migrate cohorts only after login, reset, logout, revoke, RLS, SSR refresh, and reload persistence pass.
9. **Retire:** remove the NestJS Auth module and legacy hash/session/reset access only in S8 after rollback expiry and approved retention handling.

## Failure and rollback

- Before cohort cutover, rollback simply disables Supabase Auth for that cohort; NestJS hashes and sessions remain intact.
- After a successful Supabase password change, the old hash is no longer equivalent. Do not dual-write plaintext passwords. Rollback then requires a forced reset in the selected authority.
- If Auth user creation succeeds but application linking fails, record an orphan in the manifest and disable/delete only that newly created Auth user after reconciliation approval.
- If application linking succeeds but Auth activation fails, clear the link through a reviewed compensating operation; never reuse the Auth ID for another person.

## Required tests

- Argon2id hash import for every observed parameter set.
- Correct/incorrect password, reset, email/phone confirmation, MFA policy if enabled, logout, refresh, and revoke.
- Username bridge enumeration and rate-limit tests.
- Active, invited, inactive, suspended, locked, archived, and forced-reset accounts.
- Resident/staff/worker role mapping and last-super-admin protection.
- Same-society and cross-society RLS with fresh and stale tokens.
- Auth Admin and service-role keys absent from browser bundles, logs, database rows, and error bodies.
- Cohort rollback before and after a password change.

## S2 exit decision

Hash-preserving migration is approved only if the compatibility pilot and staging rehearsal pass. Otherwise the documented per-account forced-reset fallback becomes the migration method. No production account is migrated solely on the assumption that an encoded Argon2 string is compatible.

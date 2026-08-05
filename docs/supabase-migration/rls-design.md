# Multi-society RLS design

## Security objective

Every request made through Supabase's Data API must be safe even if the caller bypasses the Next.js UI. PostgreSQL, not browser state or JWT user metadata, is the final authorization boundary. Phase S0 creates no policies; Phase S3 will implement and test them locally.

The design follows the Supabase guidance for [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): policies target `authenticated` or `anon`, use `(select auth.uid())`, and use `security_invoker = true` for exposed views. User-editable `raw_user_meta_data` is never an authorization source.

## Identity and membership shape

The current `user_account` is society-scoped and owns roles, sessions, resident/staff/worker links, and audit relationships. During S2 add a nullable, unique `auth_user_id uuid references auth.users(id) on delete restrict`; backfill it only after an Auth user is created and reconciled. Do not replace application primary keys with Auth IDs during the transition.

`user_role` remains the authoritative society membership and permission source. A user is a society member only when:

1. `user_account.auth_user_id = auth.uid()`;
2. the account and society are active; and
3. an active role for the same `society_id` exists through `user_role`.

The present schema supports one `user_account` per application identity. Before permitting a single Auth identity in multiple societies, S2 must either introduce a dedicated `society_membership` table or change the account uniqueness model deliberately. It must not infer multi-society authority from a JWT array alone.

Platform super-administrator access must use a separate, private grant table keyed by `auth.users.id`, with two-person operational approval and audit history. It must not mean “all users holding a society-local role named SUPER_ADMINISTRATOR.”

## Private authorization helpers

Create helpers in an unexposed `private` schema. Revoke execution from `public` by default and grant only the minimum required functions to `authenticated`.

| Helper                                                            | Purpose                                          | Required behavior                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `private.current_account_id()`                                    | Resolve `auth.uid()` to active `user_account.id` | Returns null for missing, suspended, archived, or ambiguous links                                     |
| `private.is_platform_super_admin()`                               | Check the separately managed platform grant      | Stable SQL function; never reads user metadata                                                        |
| `private.is_society_member(society_id)`                           | Confirm active membership                        | Validates account, society, role assignment, and role status                                          |
| `private.has_permission(society_id, permission_code)`             | Resolve role permissions                         | Joins `user_role`, `role`, `role_permission`, and `permission`; rejects cross-society role mismatches |
| `private.owns_resident(resident_id)`                              | Resolve resident ownership                       | Matches resident `user_id` to the current application account and verifies active society membership  |
| `private.owns_staff(staff_id)` / `private.owns_worker(worker_id)` | Resolve workforce self-access                    | Used only for explicitly permitted self-service fields                                                |
| `private.row_society(parent_table, parent_id)`                    | Avoid client-provided tenant claims              | Prefer dedicated stable helpers per aggregate rather than dynamic SQL                                 |

Any `SECURITY DEFINER` helper must set `search_path = pg_catalog, public, private`, schema-qualify objects, reject null callers, avoid dynamic SQL, and have explicit `EXECUTE` grants. Functions that change data also set actor and correlation context for audit triggers.

## Policy archetypes

### Society administrators

- `SELECT`: row `society_id` must satisfy `private.is_society_member` and the appropriate read permission.
- `INSERT`: `WITH CHECK` requires the caller's authorized society and disallows actor fields that do not match the current account.
- `UPDATE`: both `USING` and `WITH CHECK` are required; protected lifecycle and financial columns are changed only through RPC.
- `DELETE`: denied on operational tables. Configuration rows use archive/deactivate RPCs.

### Residents

Residents may select only records connected to `private.owns_resident(...)`. Direct mutations are limited to explicitly editable profile fields, own household members, notification read state/preferences, and permitted ticket messages. Resident ID, identity data, occupancy, fees, ledger, account state, internal notes, audit records, provider records, and status histories are never directly mutable.

### Staff and workers

Staff receive only permissions granted by current society roles. Worker login accounts may read their own safe work schedule and assigned operational details. Internal performance notes, salary records, resident financial data, and unrelated residents remain denied. Contact disclosure requires an active assignment plus a recorded disclosure/consent rule.

### Platform super administrators

Platform-wide access is allowed only through helper-checked policies or privileged RPCs. Every cross-society read/write records an audit event containing the target society and justification. Normal application requests do not use `service_role` to simulate this access.

### Anonymous verification

`anon` receives no table-level access to residents, receipts, salary slips, or ID cards. Public QR routes call narrow `SECURITY DEFINER` verification functions with opaque, hashed, high-entropy tokens. Responses contain only safe validity fields: document/card reference, society display name, status, issue/expiry dates, and revocation state. Rate limiting and enumeration-resistant responses are required at the gateway/Edge Function.

## Table-family coverage

The following policy families cover all 105 current Prisma models. Child-table policies resolve society through their parent and never trust a child foreign key supplied by the browser.

| Family                | Tables/models                                                                                                                                                                                                                                                                                                                                                                                                                      | RLS rule                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity/access       | `Society`, `UserAccount`, `Role`, `Permission`, `RolePermission`, `UserRole`, `UserSession`, `PasswordResetToken`, `SystemSetting`, `AuditLog`, `OutboxEvent`                                                                                                                                                                                                                                                                      | Safe society/account views only; role changes by RPC; Auth owns sessions/reset tokens after S2; audit/outbox inaccessible for direct writes |
| Property/resident     | `Property`, `Unit`, `Resident`, `ResidentOccupancy`, `HouseholdMember`, `Vehicle`, `ResidentDocument`, `ResidentFeeAssignment`, `ResidentIDCard`, `ResidentIDSequence`                                                                                                                                                                                                                                                             | Admin permission or resident ownership; registration, occupancy, lifecycle, IDs, and fee assignment by RPC                                  |
| Finance configuration | `FeePlan`, `FeePlanComponent`, `LateFeeRule`, `BillingPeriod`, `FinancialBatch`, `FinancialSettingPeriod`                                                                                                                                                                                                                                                                                                                          | Society financial permissions; effective-dated changes and generation by RPC                                                                |
| Finance operations    | `MonthlyDue`, `DueLineItem`, `FinancialLedgerEntry`, `Payment`, `PaymentAllocation`, `PaymentProof`, `PaymentAdjustment`, `DiscountOrWaiver`, `PaymentProviderTransaction`, `PaymentReversal`, `Refund`, `ResidentCreditBalance`, `Receipt`, `ReceiptSequence`                                                                                                                                                                     | Residents read their own safe projections; staff by permission; all monetary mutations by guarded RPC; ledger append-only                   |
| Staff/payroll         | `Department`, `JobTitle`, `StaffMember`, `EmploymentRecord`, `StaffStatusHistory`, `StaffDocument`, `SalaryStructure`, `SalaryPeriod`, `SalaryRecord`, `SalaryPayment`, `SalaryAdjustment`, `SalarySlip`, `StaffIDSequence`, `SalarySlipSequence`                                                                                                                                                                                  | Society workforce/payroll permissions; sensitive columns through masked views; payroll mutation by RPC                                      |
| Workers               | `ContractorCompany`, `WorkerCategory`, `WorkerSkill`, `ServiceWorker`, `WorkerSkillAssignment`, `WorkerAvailability`, `WorkerAvailabilityOverride`, `WorkerScheduleReservation`, `WorkerRate`, `WorkerDocument`, `WorkerPerformanceNote`, `WorkerStatusHistory`, `WorkerIDSequence`                                                                                                                                                | Maintenance/workforce permissions; worker self-view only where approved; reservations/status/performance by RPC                             |
| Complaints            | `ComplaintCategory`, `Complaint`, `ComplaintMessage`, `ComplaintAttachment`, `ComplaintStatusHistory`, `ComplaintAdministratorAssignment`                                                                                                                                                                                                                                                                                          | Resident owner or authorized society staff; confidential/internal fields separated into safe views; transitions by RPC                      |
| Maintenance           | `MaintenanceCategory`, `TicketSequence`, `MaintenanceRequest`, `MaintenanceMessage`, `MaintenanceAttachment`, `MaintenanceStatusHistory`, `WorkerAssignment`, `MaintenanceAppointment`, `MaintenanceResolution`, `ServiceRating`, `ServiceLevelPolicy`, `EscalationRecord`, `ContactDisclosureLog`                                                                                                                                 | Owner, authorized staff, or assigned worker according to operation; assignment/reservation/disclosure transitions by RPC                    |
| Notifications         | `NotificationTemplate`, `NotificationTemplateVersion`, `NotificationBatch`, `Notification`, `NotificationRecipient`, `NotificationDelivery`, `DeliveryAttempt`, `NotificationProviderReference`, `NotificationPreference`, `ConsentOrPreferenceHistory`, `NotificationSchedule`, `Announcement`, `AnnouncementAudience`, `AnnouncementAudienceSnapshot`, `AnnouncementAttachment`, `ProviderCallbackEvent`, `NotificationJobClaim` | Recipient reads own notification projection; preference RPC; administration by permission; delivery internals restricted to queue workers   |
| Profile workflow      | `ProfileCorrectionRequest`                                                                                                                                                                                                                                                                                                                                                                                                         | Resident creates/reads own; authorized administrator reads/transitions within society                                                       |

## Safe views and column controls

RLS controls rows, not columns. Expose dedicated `api`-schema views for resident directory, resident self-profile, staff/worker directory, payment summary, ticket summary, notification inbox, audit summary, and public verification. Sensitive columns such as password hashes, encrypted identities, identity search hashes, object keys, bank details, provider payloads, callback signatures, internal notes, and unrestricted audit JSON are absent. Views use `security_invoker = true`; base-table grants are revoked where a view is the intended interface.

## Storage policies

All buckets are private. Object names use `<society-id>/<domain>/<owner-id>/<random-uuid>.<extension>` and database metadata remains authoritative.

- `SELECT`: allow through a signed URL produced only after an authenticated ownership/permission RPC; direct object selection is denied unless a narrowly tested policy is needed.
- `INSERT`: use an Edge Function or constrained upload grant that validates bucket, society prefix, owner, MIME signature, size, and a pending metadata row.
- `UPDATE`: deny object overwrite. Replacements create a new immutable key and archive old metadata.
- `DELETE`: restricted maintenance function only after retention and legal-hold checks; normal archive does not delete the object.
- Service role is confined to named Edge Functions and offline migration tooling. It is never present in Next.js client variables, logs, generated links, or database rows.

## Required RLS test matrix

For every exposed table/view/RPC test: unauthenticated, resident owner, another resident in the same society, resident in another society, authorized administrator, under-privileged administrator, worker/staff self, and platform super administrator. Cover `SELECT`, `INSERT`, `UPDATE`, `DELETE`, direct base-table attempts, crafted society IDs, stale JWT claims, suspended accounts, archived societies, and Storage path substitution. Tests must run with real `anon`/`authenticated` JWTs, not a database owner connection.

## Acceptance gate

No domain moves to the browser Data API until its complete policy inventory has zero uncovered exposed tables, ownership tests pass, query plans use indexed tenant/owner paths, safe views contain no protected columns, and the NestJS-vs-Supabase reconciliation suite is clean.

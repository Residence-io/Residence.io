# Residence.io Agent Rules

This document outlines the mandatory rules, baseline architecture, and safety constraints for all automated coding agents (including Cline) working on the Residence.io codebase.

---

## 1. Architecture

- **Web Frontend**: Next.js 16 (App Router) / React 19 / Tailwind CSS.
- **Backend API**: NestJS 11 (Modular Domain Architecture).
- **ORM / Persistence**: Prisma 7 / PostgreSQL (Supabase).
- **Monorepo**: npm workspaces with Turbo repo orchestrator (`apps/web`, `apps/api`, `packages/shared`).
- **Supabase Integration**:
  - Used for Supabase Auth, session lifecycle, custom access token claims, and protected object storage.
  - NestJS domain API is the **sole authority** for business and domain commands.
  - Prisma / PostgreSQL physical schema is the **canonical source of business persistence**.
  - **The browser must NEVER directly mutate complex business tables through the Supabase client.**

---

## 2. Society Isolation

- Residence.io is a strict multi-tenant platform centered around `societyId`.
- Every business operation must enforce society isolation at the controller, service, and database query levels.
- **Do not trust `societyId`, `residentId`, or `userId` from request bodies** when the actor's identity/society can be derived securely from authenticated request context (`req.user`).
- Prevent all cross-society Insecure Direct Object References (IDOR).

---

## 3. Change Discipline

- Make the **smallest correct change only**.
- No speculative cleanup, unrelated refactoring, or spontaneous UI redesigns.
- Preserve existing working architecture, mobile/desktop responsiveness, and accessibility across breakpoints (360px–1440px).
- Do not modify unrelated pages, routes, or modules.

---

## 4. Test Baseline & Verification

### Locked Pre-Phase 7 Baseline:

- **39 test suites** (29 API, 10 Web)
- **141 tests**
- **0 failed, 0 skipped**
- `npm run verify` exit code 0

### Invariant Rules:

- **Never remove tests** to make CI/builds pass.
- **Never skip tests** without explicit justification.
- **Never weaken assertions** or replace integration/concurrency tests with trivial unit mocks.
- Always run and pass `npm run verify` before concluding tasks.

---

## 5. Database & Migration Invariants

- **Migrations 1 through 18 are production-applied and IMMUTABLE.**
  - `20260714170000_phase_1_foundation`
  - `20260714210000_phase_2_resident_management`
  - `20260714230000_phase_3_dues_payments`
  - `20260716120000_phase_4_staff_workers`
  - `20260717120000_phase_5_complaints_maintenance`
  - `20260718120000_phase_6_notifications`
  - `20260720120000_phase_7_settings_reports`
  - `20260728190000_resident_registration_simplification`
  - `20260728200000_resident_profile_photo_integrity`
  - `20260730200000_allow_resident_cnic_multiple_properties`
  - `20260820135836_visitor_checkin_unique` (repaired)
  - `20260820145111_parking_permit_unique` (repaired)
  - `20260821070000_facility_booking_system`
  - `20260821100000_resident_self_service_expansion`
  - `20260821120000_active_primary_occupancy_constraint`
  - `20260821130000_phase6_financial_expansion`
  - `20260821140000_phase6_bank_transactions_and_matching`
  - `20260821150000_phase6_final_lock`
- **Never edit migrations 1–18 again.**
- All future database changes require **new additive forward migrations**.
- **Never run against production without explicit user approval:**
  - `prisma migrate deploy`
- **Never use against production:**
  - `prisma migrate dev`
  - `prisma migrate reset`
  - `prisma db push`
  - `--force-reset`
- **Required sequence before any production deployment:**
  1. Full database backup.
  2. Precondition check.
  3. Migration status inspection.
  4. Explicit owner authorization.
  5. Post-deployment live verification.

---

## 6. Financial Integrity

- **Do NOT create a second accounting system.**
- Preserve the canonical double-entry / ledger domain:
  - `FinancialLedgerEntry` (append-only, protected by DB immutability triggers)
  - `SocietyBankAccount` & `SocietyBankTransaction`
  - `Payment`, `PaymentAllocation`, and `Receipt`
  - `Expense` (approval, payment atomicity, bank account attribution)
  - `Budget` & `BudgetLine` (fiscal-year boundaries)
  - `BankStatement`, `BankStatementLine`, `BankReconciliation` (1:1 matching constraint)
- **Money Precision**: All monetary calculations and columns must use `Decimal` / `@db.Decimal(12, 2)` or `(14, 2)`. No floating-point math (`parseFloat`, `Number`) for financial calculations.

---

## 7. Concurrency & Invariants

Preserve and enforce database-level concurrency protections for:

- **Visitor Pass**: Partial unique index `one_active_checkin_per_pass` on `visitor_check_in` WHERE `checked_out_at IS NULL`.
- **Parking**: Partial unique indexes `one_active_permit_per_space` and `one_active_permit_per_vehicle` on `parking_permit` WHERE `status = 'ACTIVE'`.
- **Deliveries / Parcels**: Atomic status transition on collection/return.
- **Facility Bookings**: GiST exclusion constraint `no_overlapping_active_facility_bookings` preventing overlapping active bookings.
- **Occupancy**: Partial unique index `uk_resident_occupancy_unit_active_primary` ensuring one active primary resident per unit.
- **Expense Payment**: Atomic transition with bank balance decrement and `SocietyBankTransaction` creation.
- **Resident Bank Transfers**: Atomic verification, invoice allocation, receipt issuance, ledger posting, and cashbook credit.
- **Bank Reconciliation**: Database uniqueness `bank_statement_line_matched_bank_transaction_id_key` enforcing strict 1:1 matching.
- **Inventory (Phase 7)**: Atomic quantity updates with immutable movement ledger and strict negative stock prevention.
- **Polls / Voting (Phase 7)**: Database-level unique ballot constraints preventing duplicate voting under concurrency.

---

## 8. Auth, RBAC & Permissions

- Preserve authentication guards, `@RequirePermissions()` decorators, and `AuditService` logging across all endpoints.
- Role-based least-privilege matrix:
  - `SUPER_ADMINISTRATOR`: Platform-wide full access.
  - `ADMINISTRATOR`: Full society operational management.
  - `ACCOUNTS_MANAGER`: Financial management, billing, expenses, reconciliations, and financial reporting only.
  - `MAINTENANCE_MANAGER`: Maintenance, workforce, facilities, assets, and inventory operations.
  - `SECURITY_GUARD`: Gate access, visitor passes, parking verification, delivery handling.
  - `RESIDENT`: Self-service portal, own dues/payments, own complaints, visitor invitations, bookings, polls.

---

## 9. Supabase & Compatibility Views

- No browser business writes to Supabase.
- Retain all 26 `api.*` compatibility views. Do not drop compatibility views without explicit architectural review.
- Retain security definer helper functions (`public.custom_access_token_hook`, `private.current_account_id`, `api.fn_my_profile`).

---

## 10. Storage & Private Object Security

- Sensitive documents must use protected storage (`PrivateStorageService`):
  - Resident documents & CNIC scans
  - Payment proof slips
  - Vendor invoices
  - Asset documents & warranties
  - Gate parcel photos
- Never generate public URLs for confidential documents. Access must be mediated via authenticated, time-bounded signed URLs or authorized proxy streams.

---

## 11. Secrets & Environment Safety

- **Never print secrets** (database connection strings, service role keys, JWT secrets, passwords).
- **Never commit `.env` or credential files** to Git.
- Root `.env` is strictly local and untracked (only `.env.example` is committed).
- Before committing, always run the repository secret scan: `npm run security:scan` or `node scripts/secret-scan.mjs`.

---

## 12. Git Discipline

- Work directly on the canonical repository (`Residence.io-main`).
- No force pushes (`--force`, `--force-with-lease`).
- No history rewrites or squashing unless explicitly instructed.
- Keep the working tree clean at all checkpoints.

---

## 13. Phase Roadmap & Scope

- **Phases 1–6**: Accepted and in production.
- **Phase 7**: Final numbered feature phase.
  - 7A: Asset Management
  - 7B: Inventory / Stores
  - 7C: Polls & Voting
  - 7D: Advanced Reports / Analytics
  - 7E: Final Platform-Wide Hardening
- **No Phase 8**: Following Phase 7 completion, the next step is a dedicated **Production Readiness Gate** (E2E testing, disaster recovery, production load verification, security pen-testing).

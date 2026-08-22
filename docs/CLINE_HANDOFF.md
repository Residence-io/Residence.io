# Residence.io — Cline Handoff Document

---

## 1. Current Project Status

- **Phases 1 through 6**: Substantially complete, audited, and accepted.
- **Phase 7**: Ready for implementation (**DO NOT START without reviewing instructions**).
- **Production Database**:
  - Live on Supabase project `icffsyxlrgmwdjaazoue` (status: **CURRENT**).
  - Exactly **18 of 18 migrations applied**, 0 pending, 0 active failed migrations.
  - Migration 11 Visitor DDL and Migration 12 Parking SQL syntax were repaired and successfully deployed.
  - **Migrations 1–18 are now permanent and IMMUTABLE.**
- **Automated Verification Baseline**:
  - **39 test suites** (29 API, 10 Web)
  - **141 tests passing (100% PASS)**
  - `npm run verify` exit code 0
- **Git State**: `origin/main` is synchronized with `local main`. Working tree clean.

---

## 2. Current Architecture Summary

- **Web Frontend (`apps/web`)**: Next.js 16 (App Router), React 19, Tailwind CSS. Consumes NestJS domain endpoints via `/api/proxy/*` and server actions. No direct business mutations to Supabase.
- **Backend API (`apps/api`)**: NestJS 11 modular domain architecture. Enforces authentication, RBAC permissions, society isolation, DTO validation, and transaction boundaries.
- **Prisma & Database (`apps/api/prisma`)**: Prisma 7 ORM mapped to physical PostgreSQL schema (`public` tables).
- **Shared Package (`packages/shared`)**: Common role codes, permission constants, user session interfaces, and PostgREST view types.
- **Supabase Integration**:
  - Auth, session handling, custom JWT claim hook (`public.custom_access_token_hook`).
  - Protected storage for private documents mediated by `PrivateStorageService`.
  - 26 PostgREST compatibility views under `api.*` schema.

---

## 3. Existing Implemented Domains (Phases 1–6)

1. **Core / Administration**: Society, Properties, Units, User Accounts, Roles, Permissions, System Settings, Audit Logging.
2. **Resident Management**: Residents, Occupancy, Household Members, ID Card Preview/Verification, Vehicles, Parking Permits.
3. **Billing & Dues**: Billing Periods, Fee Plans, Fee Assignments, Monthly Dues, Ledger Entries, Advance Credit Balances.
4. **Payments & Cashbook**: Payment recording, Bank Transfer verification, Invoice Allocations, Receipts, Waivers, Adjustments, Reversals, Refunds, Society Bank Accounts, Society Bank Transactions.
5. **Workforce & Staff**: Staff Directory, Employment Contracts, Salary Periods, Salary Slips, Service Workers, Skill Categories, Worker Availability, Shifts.
6. **Helpdesk & Tickets**: Complaint Categories, Complaints, Maintenance Categories, Maintenance Requests, Work Orders, Worker Assignments, Escalations, Feedback Ratings.
7. **Communications**: Notifications (SMS, Email, Push, In-App), Templates, Delivery Logs, Announcements, Emergency Broadcasts.
8. **Security & Gate**: Visitor Passes, QR Access Codes, Gate Check-In/Out, Parcels & Courier Deliveries, Parking Permits, Vehicle Verification.
9. **Facilities & Amenities**: Facility Catalog, Blockout Windows, Amenity Bookings, GiST Temporal Overlap Prevention.
10. **Resident Self-Service**: Move-In / Move-Out NOC Requests, Document Uploads, Profile Correction Requests, Community Events, Emergency Directory.
11. **Finance Expansion**: Vendors, Expenses, Society Budgets, Budget Lines, Bank Statements, Bank Statement Lines, Bank Reconciliation (1:1 matching constraint).

---

## 4. Critical Database Invariants

- **Visitor Domain**: `one_active_checkin_per_pass` UNIQUE on `visitor_check_in(visitor_pass_id)` WHERE `checked_out_at IS NULL`.
- **Parking Domain**:
  - `one_active_permit_per_space` UNIQUE on `parking_permit(parking_space_id)` WHERE `status = 'ACTIVE' AND parking_space_id IS NOT NULL`.
  - `one_active_permit_per_vehicle` UNIQUE on `parking_permit(vehicle_id)` WHERE `status = 'ACTIVE'`.
- **Facility Domain**: `no_overlapping_active_facility_bookings` EXCLUDE USING gist on `facility_booking(facility_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)`.
- **Occupancy Domain**: `uk_resident_occupancy_unit_active_primary` UNIQUE on `resident_occupancy(unit_id)` WHERE `primary_resident = true AND end_date IS NULL`.
- **Finance Domain**:
  - `financial_ledger_no_update` trigger preventing update/delete on `financial_ledger_entry`.
  - `bank_statement_line_matched_bank_transaction_id_key` UNIQUE on `bank_statement_line(matched_bank_transaction_id)`.
  - `society_bank_transaction_statement_line_id_key` UNIQUE on `society_bank_transaction(statement_line_id)`.
  - `payment.bank_account_id` foreign key linking transfers to bank accounts.
  - `society.fiscal_year_start_month` (default 7).

---

## 5. Phase 7 Scope & Requirements

Phase 7 is the **FINAL numbered product phase** (there is NO Phase 8):

1. **Phase 7A — Asset Management**:
   - Society physical asset tracking (generators, lifts, CCTV, pumps, equipment).
   - Collision-safe identifiers (`AST-YYYY-XXXXXXXX`).
   - Condition, warranty expiry, vendor link, maintenance request linkage.
   - Private document attachments via `PrivateStorageService`.
   - Audit logging via `AuditService`.
2. **Phase 7B — Inventory & Stores**:
   - Stock items (`InventoryItem`) and immutable movement ledger (`InventoryMovement`).
   - Movement types: `OPENING_BALANCE`, `RECEIPT`, `ISSUE`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `RETURN`.
   - Atomic quantity updates with strict negative stock prevention under concurrency.
   - Authoritative ledger reconstruction test.
   - Vendor & Maintenance Request linkage for material consumption.
3. **Phase 7C — Polls & Voting**:
   - Poll types: `GENERAL`, `SURVEY`, `AGM`, `RESOLUTION`.
   - Server-authoritative time windows (`opensAt` $le$ now $<$ `closesAt`).
   - Server-side eligibility (`ALL_ACTIVE_RESIDENTS`, `OWNERS_ONLY`, `TENANTS_ONLY`).
   - Database-backed single-choice duplicate vote prevention under concurrency.
   - Private voter collection; anonymous results reporting (no voter leak in audit/reports).
4. **Phase 7D — Advanced Reports & Analytics**:
   - Asset register, inventory status/movements, poll results, and executive multi-domain summary.
   - CSV formula injection protection (`=`, `+`, `-`, `@`).
5. **Phase 7E — Final Platform-Wide Hardening**:
   - Strict society isolation audit across all controllers.
   - RBAC least-privilege review.
   - Decimal-only money precision audit.
   - Additive forward migration (`20260822120000_phase7_master`).
   - Idempotent seed validation.

---

## 6. Common Development Commands

### Verification & Testing (Run from Root):

```bash
# Full verification pipeline (format, lint, typecheck, tests, build, security scan)
npm run verify

# Run test suites
npm test

# Check formatting and linting
npm run format:check
npm run lint
```

### Prisma Commands (Run from Root or apps/api):

```bash
# Validate schema
npx prisma validate --schema=apps/api/prisma/schema.prisma

# Format schema
npx prisma format --schema=apps/api/prisma/schema.prisma

# Generate client
npx prisma generate --schema=apps/api/prisma/schema.prisma
```

### Dangerous Commands — STRICTLY PROHIBITED AGAINST PRODUCTION:

- `npx prisma migrate dev`
- `npx prisma migrate reset`
- `npx prisma db push`
- `--force-reset`
- `npx prisma migrate deploy` (Requires explicit owner authorization and pre-deployment backup).

---

## 7. Environment & Secrets

- Root `.env` contains local development credentials and is **gitignored**.
- Only `.env.example` is tracked in version control.
- Never hardcode or log database URLs, service role keys, or access tokens.

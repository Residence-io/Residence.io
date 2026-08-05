# Phase 3 dues and payments architecture

Phase 3 is implemented in the existing TypeScript modular monorepo. `apps/api/src/finance` owns fee resolution, monthly dues, immutable ledger postings, payments, allocation, private bank proofs, adjustments, refunds/reversals, receipts, exports, and the development-only provider seam. Next.js routes under `/admin` and `/resident` consume only the NestJS API.

## Money and invariants

- PostgreSQL stores money as `decimal(18,2)` with ISO currency codes. Prisma `Decimal` is the calculation type; JavaScript floating point is never authoritative.
- Values are rounded to two decimals with `ROUND_HALF_UP` at service boundaries.
- Posted `financial_ledger_entry` rows are append-only; a database trigger rejects update or delete. Corrections, reversals, and refunds post compensating entries.
- A balance is total debits minus total credits. Advance credit is auditable in the ledger and projected in `resident_credit_balance`.
- Confirmed payments and issued dues are never silently rewritten.

## Fee resolution and dues

Resolution is deterministic: effective resident assignment, unit plan, property-type plan, then society default. Active date ranges are inclusive and overlapping plans of the same scope are rejected. An issued due snapshots the resolved source, amount, due/grace policy, late-fee rule, and unit. Phase 0 did not approve proration, so any occupancy overlapping the month receives the full monthly fee.

Generation runs in a serializable transaction. `(resident_id,billing_period_id)` and the batch idempotency key prevent duplicates. Each due creates a principal line, debit ledger entry, audit record, and transactional outbox event. Late-fee keys prevent duplicate application.

## Allocation and payment lifecycle

Selected dues are restricted to the submitted set; otherwise open dues are locked and ordered by due date, creation time, and UUID. Principal is allocated before late-fee balance. Excess becomes advance credit, which is locked and applied to the next generated due in the same currency. Cash/manual confirmed payments post immediately; bank transfers and online abstractions remain pending verification. The sandbox provider only returns pending intents, requires an HMAC secret, refuses production use, and accepts only HMAC-authenticated callbacks whose reference, payment, amount, and currency match server records.

Reversal releases allocations, restores due projections, removes any unconsumed advance, posts a debit compensation, and marks the receipt reversed. Partial and full refunds restore affected due projections in reverse allocation order, remove refundable advance credit, post debit compensations, and retain original payment history. A consumed advance must be corrected through its later due rather than silently producing a negative credit balance.

## Receipts, storage, and access

Confirmed payments receive an atomic `RCT-{YEAR}-{SEQUENCE}` number, server-rendered PDF, and QR containing an opaque token. Only its SHA-256 hash is stored. Public verification returns validity, number, amount, currency, status, and issue time. PDFs and bank proofs use the Phase 2 private-storage adapter and record no public paths.

Permissions are enforced in guards and record-level services: financial administrators require billing/payment permissions; residents resolve only the resident linked to their authenticated user. Maintenance roles receive no financial permission.

## Routes

API groups: `/fee-plans`, `/dues`, `/payments`, `/finance/ledger`, `/finance/dashboard`, `/finance/exports`, and `/receipts`.

UI routes: `/admin/payments`, `/admin/payments/[residentId]`, `/admin/payments/transactions/[id]`, `/admin/payments/verification`, `/admin/fee-plans`, `/admin/dues/generate`, `/admin/reports/financial`, `/resident/payments`, `/resident/payments/pay`, `/resident/payments/history`, `/resident/payments/receipts/[id]`, and `/verify/receipt/[token]`.

Phases 4–6 remain pending.

# Phase 3 acceptance checklist

- [x] Effective-dated fee plans and resident/unit/property/default precedence
- [x] Historical fee and unit snapshots on issued dues
- [x] Idempotent, serializable monthly generation with outbox events
- [x] Fixed/percentage late fees with duplicate prevention
- [x] Discounts, waivers, debit and credit adjustments
- [x] Append-only resident ledger with compensating corrections
- [x] Cash and pending bank-transfer payments
- [x] Private proof storage and authorized verification/rejection
- [x] Partial, selected-set, oldest-first, full and advance allocation
- [x] Development-only provider abstraction with signed, idempotent callback handling
- [x] Full reversal and partial/full refund history
- [x] Atomic PDF receipts and minimal QR verification
- [x] Administration and resident payment routes and live dashboards
- [x] Bounded, audited CSV export
- [x] Guard, society, ownership and permission enforcement
- [x] Unit, DTO, provider, PDF, migration and PostgreSQL integrity tests
- [x] Phase 1–2 source and migrations preserved
- [ ] PostgreSQL migration execution in this environment (blocked: PostgreSQL/Docker unavailable)

No Phase 4 functionality is included.

# Phase 2 acceptance checklist

- [x] Owner and tenant registration with backend tenant validation.
- [x] Atomic, society-scoped, configurable, database-unique resident ID allocation.
- [x] Optional Resident-only account provisioning with one-time temporary password and forced first change.
- [x] Property/unit management, active occupancy conflict controls, move-in, move-out, and preserved history.
- [x] Household-member and vehicle lifecycle records without automatic accounts.
- [x] Private randomized storage with content signatures, configured size limits, authorization, and audit events.
- [x] Server-side resident search, filters, stable sorting, and bounded pagination.
- [x] Optimistic resident/contact updates and reasoned activation, suspension, move-out, and archival.
- [x] Two-page physical-size ID-card PDF, opaque QR verification, revocation, regeneration, and history.
- [x] Resident self-profile and cross-resident record checks.
- [x] Granular route, service, society, ownership, file, and card authorization.
- [x] Audit events omit passwords, raw tokens, complete identity numbers, object paths, and file content.
- [x] Initial decimal fee assignment only; no Phase 3 ledger, dues, payment, or receipt implementation.
- [ ] PostgreSQL migration and concurrency suite executed (requires Docker/PostgreSQL).
- [x] Final formatting, lint, type, non-database tests, and production build verification recorded.

Phase 3 through Phase 6 remain unimplemented TypeScript phases.

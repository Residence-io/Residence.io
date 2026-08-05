# Change log

## 0.3.0-SNAPSHOT — Phase 3 Dues and Payments

- Added effective fee plans and resident assignments, scheduled/manual idempotent monthly dues, late fees, discounts, waivers, and adjustments.
- Added append-only resident ledger postings, locked oldest-first or selected allocation, partial payments, advance credit, reversals, and refunds.
- Added cash, bank-transfer proof, and development-only signed online-provider workflows with idempotent callbacks.
- Added concurrency-safe PDF receipts with opaque QR verification, financial exports, real dashboard metrics, and administration/resident Vaadin payment views.
- Added financial unit, PostgreSQL Testcontainers, provider-signature, PDF, regression, and opt-in browser tests.

## 0.2.0-SNAPSHOT — Phase 2 Resident Management

- Added owner and tenant registration with atomic resident-number generation and optional resident account creation.
- Added properties, units, occupancy history, households, vehicles, initial fee assignments, private documents, and resident lifecycle operations.
- Added lazy resident directory, administration detail/registration views, and the resident-owned profile view.
- Added encrypted identity values, exact identity search by HMAC, record-level authorization, secure storage keys, and sensitive-action audit events.
- Added physical-size PDF ID cards, QR verification with hashed opaque tokens, revocation, regeneration, and card history.
- Added unit, security, PostgreSQL Testcontainers, PDF/QR, concurrency, pagination, and opt-in browser coverage.

## 0.1.0-SNAPSHOT — Phase 1 foundation

- Finalized the Java 21, Spring Boot 4.1, Vaadin Flow 25.2 and PostgreSQL technical alignment.
- Added Maven build, executable JAR and Docker packaging.
- Added Flyway foundation schema, JPA entities, repositories and persistent sessions.
- Added database-backed authentication, BCrypt passwords, lockout, reset tokens, forced first-login password change, roles and permissions.
- Added administration and resident Vaadin shells plus reusable UI components and styling.
- Added audit logging, validation, error handling, provider ports, Actuator configuration and development seed data.
- Added unit, method-security, PostgreSQL Testcontainers and Selenium test layers.

# Phase 0 — Requirements and decisions

## Scope baseline

The supplied master development prompt is the only SRS artifact currently available in the workspace. It is therefore the source of truth. The application must retain all requested features and expose two distinct role-aware experiences:

1. Administration portal for super administrators, delegated administrators, accounts managers, and maintenance managers.
2. Mobile-first resident portal restricted to the authenticated resident's own household and records.

## Functional requirement checklist

| ID | Capability | Required outcome | Phase |
|---|---|---|---|
| AUTH-01 | Authentication lifecycle | Login/logout, reset/change password, temporary passwords, forced first-login change, expiry, activation/suspension/deactivation | 1 |
| AUTH-02 | Defensive authentication | Hashing, rate limits, login protection, optional verification and admin 2FA, session management, account audit | 1 |
| RBAC-01 | Server-side authorization | Default and custom roles, granular permissions, resource ownership checks, restricted sensitive complaints | 1 |
| ADM-01 | Admin dashboard | Database-backed KPIs, period filters, charts, activity feed, and quick actions | 1–7 |
| RES-01 | Resident registration | Personal, residence, tenant, account, vehicle, household, and emergency details | 2 |
| RES-02 | Resident records | Search, filters, sort, pagination, detail/edit, activation controls, archive, and export | 2 |
| RES-03 | Documents | Secure validated uploads with access checks and retention | 2 |
| RES-04 | Resident identity | Atomic configurable resident ID plus printable/renewable QR-verifiable ID-card PDF | 2 |
| FIN-01 | Effective-dated fees | Fee plans and assignments generate immutable historical monthly dues | 3 |
| FIN-02 | Ledger | Dues, payments, allocations, advance balance, late fees, discounts, waivers, adjustments, notes | 3 |
| FIN-03 | Payment operations | Cash/bank/online payment, verification, idempotent webhooks, partial/selected/all dues, reversals | 3 |
| FIN-04 | Financial documents | Numbered receipts, salary slips, ledgers, reports, PDF/print/export | 3–7 |
| STAFF-01 | Internal staff | Profiles, employment, protected documents, salary status/payment and salary slips | 4 |
| WORK-01 | Service workers | Categories, skills, rates/notes, status, availability, service area and performance | 4 |
| CMP-01 | Complaints | Submission, confidentiality, assignment, messages, status lifecycle, resolution/reopen, timeline | 5 |
| MNT-01 | Maintenance | Submission, scheduling, worker assignment/change, messages, lifecycle, completion/reopen/rating | 5 |
| MNT-02 | Assignment privacy | Notify both parties with only necessary contact and job information; audit disclosure | 5 |
| NOT-01 | Notifications | In-app/email/SMS adapters, recipient/read/delivery status, search/filter/read actions | 6 |
| NOT-02 | Payment reminders | Filtered audience, editable templates, preview, schedule, delivery log and retry | 6 |
| ANN-01 | Announcements | Categories, priority, audience rules, schedule/expiry, attachments, multiple channels | 6 |
| SET-01 | Society settings | Profile, locale, time zone, formats, branding and registration details | 7 |
| SET-02 | Financial settings | Effective fees, due/grace/late rules, tax, numbering, methods and providers | 7 |
| SET-03 | Operational settings | Roles, providers, templates, categories, SLAs, escalation, ID card, privacy, retention, maintenance mode | 7 |
| REP-01 | Reports and exports | Financial, resident, staff, salary, worker, complaint, maintenance, notification and audit reports | 7 |
| SYS-01 | Audit and operations | Immutable audit trail, activity logs, backup/restore process, exports and maintenance controls | 1–8 |

## Non-functional requirements

| Area | Baseline acceptance target |
|---|---|
| Security | OWASP-oriented controls; CSRF protection; secure cookies; strict authorization on every use case; encrypted transport; protected files; secrets outside source control |
| Privacy | Data minimization, masked identity values, purpose-scoped worker disclosure, configurable retention, archival rather than destructive deletion |
| Integrity | PostgreSQL constraints, `numeric` money values, transactional ledger operations, idempotency keys, optimistic locking where concurrent edits are possible |
| Accessibility | WCAG 2.2 AA target, keyboard operation, visible focus, labelled forms, announced validation, sufficient contrast |
| Responsiveness | Admin supports desktop/tablet/mobile; resident portal is mobile-first; no common-viewport horizontal overflow |
| Reliability | Retry-safe background work, transactional outbox, provider timeouts, recoverable scheduled jobs, documented backup and restore |
| Performance | Indexed search/filter columns, server pagination, bounded exports, dashboard aggregation; measurable budgets established in Phase 1 |
| Observability | Structured logs without secrets/PII, metrics, health endpoints, correlation IDs and auditable privileged actions |
| Maintainability | Modular boundaries, migrations, automated architecture checks, API documentation, test fixtures and updated guides |
| Internationalization | Society-configured time zone, currency, date and number formats; store instants in UTC and render in society zone |

## Final technical alignment

| Area | Approved implementation |
|---|---|
| Application | Java 21, Spring Boot modular monolith, Maven |
| Web interface | Vaadin Flow, with no separately authored frontend application |
| Security and validation | Spring Security and Jakarta Bean Validation |
| Data | PostgreSQL, Spring Data JPA with Hibernate, Flyway |
| Verification | JUnit 5, Mockito, Spring Boot Test, Testcontainers, and Selenium |
| Documents and codes | Apache PDFBox and ZXing |
| Operations | Spring Boot Actuator, executable JAR, and Docker |

## Decisions made for the baseline

- Start as a modular monolith, not microservices. Modules have explicit APIs and may be extracted later.
- Use one deployment with two route spaces and shared identity, authorization, notifications, audit, and files.
- Use UUID primary keys and separate human-readable, atomic society-scoped number sequences.
- Store money as `numeric(19,4)` plus ISO currency code. Application values use `BigDecimal`; rounding happens only under a configured currency policy.
- Use immutable ledger entries. A reversal creates compensating entries and references the original.
- Use a transactional outbox for email, SMS, payment-event processing, and scheduled notifications.
- Use soft archival where history exists. Physical deletion is limited to uncommitted or legally purgeable data through an audited retention workflow.
- Allocate unspecified payments to the oldest due date first, then charge creation time. Explicitly selected dues override this order. Excess becomes advance credit.

## Open business decisions

Items marked **blocking** must be confirmed before their affected milestone begins.

| ID | Question | Proposed default | Blocking phase |
|---|---|---|---|
| DEC-01 | Is the product single-society or multi-society/SaaS? | Multi-society-ready schema with one society per user membership; first release operates one society | 1 |
| DEC-02 | Can a unit have multiple simultaneous residents/households? | One active primary occupancy, multiple household members; co-owners require explicit secondary associations | 2 |
| DEC-03 | May owners retain portal access while a tenant occupies the unit? | Yes, owner has property visibility; only the active resident account receives occupant services | 2 |
| DEC-04 | Which identity-document formats and uniqueness rules apply? | Society-configured validation; encrypted full value plus searchable keyed hash; uniqueness per society | 2 |
| DEC-05 | Which payment provider and local methods are required first? | Mock/manual provider in development; provider interface; cash and bank proof first | 3 |
| DEC-06 | Are partial payments always allowed and what is the minimum? | Configurable per society; allowed by default with no minimum above currency minor unit | 3 |
| DEC-07 | How are late fees calculated and reversed? | Configurable flat or percentage rules applied by dated ledger entry; waiver uses compensating entry | 3 |
| DEC-08 | Do taxes apply to dues, services, or both? | Disabled until configured; snapshot tax calculation on each charge | 3 |
| DEC-09 | Who pays external worker charges and are they part of the society ledger? | Track estimate/actual cost, but do not bill resident until an explicit policy is approved | 5 |
| DEC-10 | Reopen windows for complaints and maintenance? | Seven days after resolution/completion; admin may override with audit reason | 5 |
| DEC-11 | Which sensitive complaint roles may view confidential tickets? | Super admin plus users holding `COMPLAINT_SENSITIVE_READ` | 5 |
| DEC-12 | Email/SMS providers, sender identities, retry limits and quiet hours? | In-app always; adapter stubs in development; three exponential retries; society-zone quiet hours | 6 |
| DEC-13 | Required retention periods and data residency? | No automatic purge until legal policy is supplied; configurable retention engine prepared | 7 |
| DEC-14 | ID-card expiry and public QR verification content? | One year; public verification returns validity, resident display name, masked unit and card status only | 2 |

## Risks and controls

- Financial correctness: use double-entry-style immutable posting, database transactions, reconciliation tests, and privileged reversals.
- Cross-resident data exposure: combine permission checks, society scoping, ownership policies, repository filters, and negative integration tests.
- Notification leakage: materialize recipients at send time, minimize template data, and audit assignment disclosures.
- Scheduled time-zone errors: retain UTC instants plus society zone and test daylight-saving boundaries even if the first society does not observe DST.
- Upload abuse: allowlisted MIME/signature checks, size limits, malware-scanning adapter, private object storage, short-lived signed downloads.

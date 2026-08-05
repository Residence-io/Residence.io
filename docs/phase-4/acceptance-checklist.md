# Phase 4 acceptance checklist

- [x] Staff and service workers have separate society-scoped records and registration workflows.
- [x] Staff, worker, and salary-slip identifiers use atomic PostgreSQL sequences and unique constraints.
- [x] Departments, job titles, categories, skills, and contractor companies are configurable and deactivatable.
- [x] Staff and worker lifecycle changes preserve status history and use optimistic versions.
- [x] Salary structures are effective-dated and historical salary records keep snapshots.
- [x] Monthly salary generation is transactional and idempotent.
- [x] Full and partial salary payments enforce currency, balance, reference, and idempotency rules.
- [x] Corrections use adjustments or compensating reversals; completed payments are not deleted.
- [x] Server-generated PDF salary slips have safe opaque verification references.
- [x] Worker eligibility evaluates status, skill, category, area, hours, leave, and reservations.
- [x] Private documents are validated, randomized, authorization-checked, and audited.
- [x] Directories use server-side filtering, stable sorting, and pagination.
- [x] Dashboard totals and exports use database data and permission checks.
- [x] RBAC prevents resident workforce access and separates salary and maintenance permissions.
- [x] Audit and outbox records cover sensitive workforce and salary actions.
- [x] Phase 1-3 migrations are unchanged and regressions remain in the verification suite.
- [ ] PostgreSQL migration and concurrency execution: blocked when local Docker/PostgreSQL is unavailable.
- [x] Phase 5 complaints/assignments and Phase 6 delivery were not started.

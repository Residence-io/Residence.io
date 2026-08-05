# Phase 5 setup and demonstration

Use the existing Phase 1-4 environment and approved local PostgreSQL database. No new secret is required. Apply the Phase 5 migration only to an approved local database and run the existing seed so administrators and maintenance managers receive ticket permissions.

Demo workflow:

1. Create complaint and maintenance categories and service-level policies in administration.
2. Sign in as the seeded resident and submit one complaint and one maintenance request.
3. Triage both tickets. Approve maintenance, choose an eligible Phase 4 worker, and schedule a visit.
4. Add resident-visible and internal messages, record a resolution, complete the request, confirm closure, and submit a rating.
5. Review timelines, dashboard totals, protected attachments, SLA state, and authorized CSV exports.

Accounts managers have no Phase 5 access. Uploaded attachments, private storage, `.env` files, dependencies, builds, logs, coverage, and database files remain untracked.

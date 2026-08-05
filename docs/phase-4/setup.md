# Phase 4 setup and demo

Use the repository's Phase 1 setup and PostgreSQL environment. No new secret is required. Apply migrations only to an approved local database, then run the existing seed command so the Phase 4 permissions are assigned to the development roles.

Demo flow:

1. Sign in as the seeded super administrator or administrator.
2. Create a department and job title at `/admin/departments`.
3. Register staff at `/admin/staff/new`, create an effective salary structure, and generate a monthly salary period.
4. Record partial or full payments, generate a salary slip, and verify its opaque QR reference.
5. Create worker categories, skills, and contractor companies at `/admin/worker-categories`.
6. Register workers at `/admin/workers/new`, add weekly availability, and query eligibility for a requested time.

Accounts managers receive approved salary read/pay/reversal and export permissions. Maintenance managers receive worker management, scheduling, performance, and export permissions. Residents have no workforce access.

Uploaded workforce documents, generated salary slips, local storage, `.env` files, and database files must remain untracked.

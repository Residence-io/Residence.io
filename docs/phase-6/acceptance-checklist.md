# Phase 6 acceptance checklist

- [x] Society-scoped in-app notifications and resident notification history are implemented.
- [x] Resident preferences and immutable consent history are implemented.
- [x] Allow-listed, safely rendered, versioned templates are implemented.
- [x] Payment reminders use real Phase 3 dues and recalculate outstanding values for preview.
- [x] Announcement audiences are validated and snapshotted.
- [x] Emergency announcements require their dedicated permission.
- [x] Durable schedules, idempotency keys, leases, and multi-instance row claiming are implemented.
- [x] Per-channel attempts and truthful accepted/delivered status are preserved.
- [x] Authenticated, idempotent provider callbacks are implemented.
- [x] Email and SMS provider interfaces and safe development sandboxes are implemented.
- [x] Recipient ownership, society isolation, RBAC, masking, and audit events are enforced.
- [x] Administration and resident notification routes are connected to real API data.
- [x] Phase 1–5 outbox events can become asynchronous in-app notifications when recipient metadata is present.
- [x] Prisma migration, unit tests, documentation, and production routes are present.
- [ ] Live email and SMS adapters require provider selection and deployment credentials.
- [ ] PostgreSQL migration execution and database concurrency tests require an available dedicated PostgreSQL/Docker environment.
- [x] Phase 7 was not started.

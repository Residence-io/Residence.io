# Phase 6 notification architecture

Phase 6 is implemented in the existing TypeScript monorepo. `NotificationsModule` owns templates and immutable template versions, in-app recipients, per-channel deliveries and attempts, preferences and consent history, durable schedules, audience snapshots, announcements, callbacks, and job claims. It reuses society-scoped sessions, RBAC, Prisma transactions, the audit service, and Phase 1–5 outbox events.

## Delivery and scheduling

Schedules and delivery rows are stored in PostgreSQL. Workers claim due rows with `FOR UPDATE SKIP LOCKED` and a lease record, so concurrent application instances do not process the same delivery. Every batch, notification, and channel delivery has a unique idempotency key. Retry delay uses bounded exponential backoff with jitter; permanent failures are not retried indefinitely. Provider acceptance is recorded as `ACCEPTED`, never as `DELIVERED`.

In-app delivery is complete. Email and SMS use explicitly labelled sandbox providers in development. They never claim external delivery and configuration validation prevents sandbox mode in production. Production adapters can implement `NotificationProvider` without changing notification or scheduling services.

## Privacy and authorization

Residents query and change only their own recipient and preference rows. Mandatory in-app delivery remains enabled. Administration routes require notification, announcement, template, log, provider, or emergency permissions at the API boundary. Audiences are resolved within the current society and snapshotted. Destinations are masked in delivery logs. Template variables are allow-listed, values are escaped, expression syntax is rejected, and email subjects reject line breaks.

Provider callbacks require an HMAC signature, resolve an existing provider reference, retain a payload hash, and use a provider/callback unique key for idempotency. Full provider payloads and secrets are not audited.

## Routes

API routes are under `/api/v1/notifications`: inbox, preferences, dashboard, templates, compose, payment-reminder preview, announcements, delivery logs, retry, processing, and callbacks.

Administration UI: `/admin/notifications`, `/admin/notifications/compose`, `/admin/notifications/batches/[id]`, `/admin/notifications/templates`, `/admin/notifications/templates/[id]`, `/admin/notifications/delivery-logs`, `/admin/announcements`, `/admin/announcements/new`, and `/admin/announcements/[id]`.

Resident UI: `/resident/notifications`, `/resident/notifications/[id]`, and `/resident/notifications/preferences`.

Phase 7 has not been started.

# Phase 6 setup and demonstration

Use the repository's Node version and npm lockfile. Copy environment values from the existing example only; never commit an environment file.

Phase 6 configuration:

- `NOTIFICATION_PROVIDER_MODE=sandbox` for local development; production must use `disabled` until a real adapter is configured.
- `NOTIFICATION_EMAIL_FROM` and `NOTIFICATION_SMS_SENDER` identify configured senders.
- `NOTIFICATION_CALLBACK_SECRET` is required only for provider callbacks and must contain at least 32 characters. It is a deployment secret.

Generate the Prisma client, apply the migration to a dedicated PostgreSQL database, seed development roles, then start the API and web applications using the existing workspace scripts. Do not apply migrations to an unknown or shared database.

Demonstration:

1. Sign in as the seeded administrator.
2. Open `/admin/notifications`, publish a template, compose an in-app batch, or publish an announcement.
3. Review channel-specific status in delivery logs.
4. Sign in as the seeded resident and open `/resident/notifications` and preferences.
5. Confirm that another resident's recipient ID is rejected by the ownership-scoped API.

Sandbox email and SMS entries will be marked skipped with a safe explanation. This is expected and must not be represented as real delivery.

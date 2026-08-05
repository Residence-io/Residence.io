# Residence.io API

NestJS owns authentication, RBAC, validation, society isolation, auditing, business transactions, provider abstractions, and Prisma/PostgreSQL access. The production entry is `dist/src/main.js`.

From the repository root, use `npm run prisma:generate`, `npm run db:migrate:deploy`, and `npm run db:seed`. Development migration creation uses `npm run db:migrate`; production and CI must use deploy. Health endpoints are `/api/v1/health/live`, `/api/v1/health/ready`, and `/api/v1/health/configuration`. The configuration endpoint reports only provider modes and never credentials.

Private files are stored outside public web assets at `PRIVATE_STORAGE_ROOT`; startup fails if the directory cannot be created or read and written. Email, SMS, and payment sandbox adapters never claim live delivery and are rejected in production configuration.

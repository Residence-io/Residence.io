# Phase 2 setup

Use Node.js `>=22.12 <25`, npm 11, and PostgreSQL. No `.env` file is committed.

Required Phase 1 variables remain required. Phase 2 additionally requires:

| Variable | Purpose |
|---|---|
| `IDENTITY_DATA_KEY` | At least 32 characters; encrypts and indexes protected identity numbers. Store in a secret manager and never rotate without a data migration. |
| `PRIVATE_STORAGE_ROOT` | Private server-side storage root; defaults to `var/private` and must not be under `apps/web/public`. |
| `RESIDENT_FILE_MAX_BYTES` | Server-side upload limit; defaults to 5,000,000. |
| `PUBLIC_WEB_URL` | Public web origin used in card verification URLs. |

Install and prepare:

```text
npm ci
npm run prisma:validate
npm run prisma:generate
npm run db:migrate
npm run db:seed
```

`db:migrate` and `db:seed` require a known development PostgreSQL database. Never run them against an unknown or shared database. Development seeding also requires `RESIDENCE_SEED_PASSWORD`; plaintext credentials are not stored in the repository.

Start both applications with `npm run dev`. The frontend defaults to `http://localhost:3000` and the API to `http://localhost:3001/api/v1`.

Demo workflow: create a property and unit through an authorized account, register an owner or tenant at `/admin/residents/new`, copy any generated temporary password once, upload required documents from the resident detail view, generate the ID card, and verify its QR URL. A linked Resident-role account can view only `/resident/profile`, its permitted documents, and its active ID card.

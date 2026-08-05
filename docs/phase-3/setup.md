# Phase 3 setup

Use Node.js `>=22.12 <25`, npm 11, and a dedicated PostgreSQL 16+ development database. Keep all Phase 1–2 variables. Phase 3 optionally reads `PAYMENT_SANDBOX_SECRET` only in development/test; leaving it unset disables online sandbox intents. Never configure the sandbox in production.

```text
npm ci
npm run prisma:validate
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Migration `20260714230000_phase_3_dues_payments` is forward-only. Do not run it against an unknown or shared database. Bank proofs and receipt PDFs use `PRIVATE_STORAGE_ROOT`; that directory must remain private and untracked.

Demo flow: create a society-default fee plan, preview/generate a billing period, record cash or initiate bank transfer, verify pending proof as an authorized accounts user, inspect the resident ledger, then download and QR-verify the receipt.

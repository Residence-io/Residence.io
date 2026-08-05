# Residence.io — Smart Society Management System

## Overview

Residence.io is a full-stack society management system with:

- **Admin portal** — Manage residents, properties, staff, payments, complaints, maintenance, notifications
- **Resident portal** — View dues, complaints, maintenance requests
- **Backend API** — NestJS + Prisma + PostgreSQL
- **Frontend** — Next.js 16

---

## Project Structure

```
Residence.io/
├── apps/
│   ├── api/              ← NestJS Backend (runs on port 3001)
│   │   ├── src/          ← All API source code
│   │   │   ├── residents/        ← Resident management
│   │   │   ├── properties/       ← Property management
│   │   │   ├── finance/          ← Payments & dues
│   │   │   ├── workforce/        ← Staff & workers
│   │   │   ├── complaints/       ← Complaints
│   │   │   ├── maintenance/      ← Maintenance requests
│   │   │   ├── notifications/    ← Notifications system
│   │   │   ├── auth/             ← Login/logout/sessions
│   │   │   └── administration/   ← Dashboard & reports
│   │   └── prisma/
│   │       ├── schema.prisma     ← Database schema
│   │       ├── migrations/       ← DB migration files
│   │       └── seed.ts           ← Dev seed data (superadmin etc.)
│   │
│   └── web/              ← Next.js Frontend (runs on port 3000)
│       └── src/
│           ├── app/
│           │   ├── admin/        ← Admin portal pages
│           │   │   ├── dashboard/
│           │   │   ├── residents/
│           │   │   ├── properties/
│           │   │   ├── payments/
│           │   │   ├── staff/
│           │   │   ├── complaints/
│           │   │   ├── maintenance/
│           │   │   ├── notifications/
│           │   │   ├── reports/
│           │   │   └── settings/
│           │   ├── resident/     ← Resident portal pages
│           │   └── login/        ← Login page
│           ├── components/       ← Reusable UI components
│           └── lib/              ← API client, types, utilities
│
├── packages/
│   └── shared/           ← Shared types between API and Web
│
├── supabase/             ← Supabase migration files (future)
├── docs/                 ← Technical documentation
├── .env                  ← LOCAL secrets (never commit this!)
├── .env.example          ← Template for environment variables
└── START.bat             ← Double-click to start the app!
```

---

## Quick Start (First Time)

### Prerequisites

- Node.js 20+
- PostgreSQL running locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env` and fill in your values (already done if you have `.env`)

### 3. Run Database Migrations

```bash
npm run db:migrate:deploy --workspace api
```

### 4. Seed Development Data

```powershell
$env:NODE_ENV='development'
$env:RESIDENCE_SEED_ENABLED='true'
node node_modules\prisma\build\index.js db seed
```

_(Run from apps/api directory)_

### 5. Start the App

**Easiest way:** Double-click `START.bat` in the project root

**Or manually:**

```bash
# Terminal 1 — Start API (port 3001)
node node_modules\@nestjs\cli\bin\nest.js start --watch

# Terminal 2 — Start Web (port 3000)
node node_modules\next\dist\bin\next dev
```

### 6. Login

Open: http://localhost:3000/login

- Username: `superadmin`
- Password: (see `RESIDENCE_SEED_PASSWORD` in `.env`)

---

## Default Login Credentials

| Role        | Username     | Password                                     |
| ----------- | ------------ | -------------------------------------------- |
| Super Admin | `superadmin` | Value of `RESIDENCE_SEED_PASSWORD` in `.env` |

---

## Current Branch

`migration/supabase-phase-s1-foundation` — Supabase migration Phase S1 (local foundation)

### Git Branch Map

| Branch                                   | Purpose                            |
| ---------------------------------------- | ---------------------------------- |
| `main`                                   | Stable production-ready code       |
| `migration/supabase-phase-s1-foundation` | Current — Supabase migration S1    |
| `fix/resident-registration-workflow`     | Resident registration improvements |

---

## API Endpoints (Base: http://localhost:3001/api/v1)

| Module        | Base Path                     |
| ------------- | ----------------------------- |
| Auth          | `/auth/login`, `/auth/logout` |
| Residents     | `/residents`                  |
| Properties    | `/properties`                 |
| Finance       | `/dues`, `/payments`          |
| Staff         | `/staff`                      |
| Workers       | `/workers`                    |
| Complaints    | `/complaints`                 |
| Maintenance   | `/maintenance`                |
| Notifications | `/notifications`              |
| Dashboard     | `/administration/dashboard`   |

---

## Environment Variables (`.env`)

| Variable                  | Purpose                      |
| ------------------------- | ---------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string |
| `SESSION_SECRET`          | Session encryption key       |
| `IDENTITY_DATA_KEY`       | CNIC encryption key          |
| `RESIDENCE_SEED_PASSWORD` | Dev superadmin password      |
| `NEXT_PUBLIC_API_URL`     | Frontend → API URL           |

---

## Troubleshooting

### App not starting?

1. Check PostgreSQL is running
2. Run `npm install` if node_modules missing
3. Check `.env` file exists with all values

### Port already in use?

```powershell
# Kill port 3000
netstat -ano | findstr ":3000" | findstr "LISTENING"
Stop-Process -Id <PID> -Force

# Kill port 3001
netstat -ano | findstr ":3001" | findstr "LISTENING"
Stop-Process -Id <PID> -Force
```

### Database errors?

```bash
npm run db:migrate:deploy --workspace api
```

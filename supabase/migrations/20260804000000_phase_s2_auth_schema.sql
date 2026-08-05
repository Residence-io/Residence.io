-- Phase S2: Supabase Auth — User Account Link
-- Adds auth_user_id, auth_migration_state, auth_migrated_at to user_account
-- so each local account can be linked to a Supabase Auth user.

-- Migration state enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_migration_state_enum') THEN
    CREATE TYPE "auth_migration_state_enum" AS ENUM (
      'PENDING',
      'IMPORTED',
      'RESET_REQUIRED',
      'VERIFIED',
      'FAILED'
    );
  END IF;
END $$;

-- Add auth link columns
ALTER TABLE "user_account"
  ADD COLUMN IF NOT EXISTS "auth_user_id"         UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS "auth_migration_state" auth_migration_state_enum NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "auth_migrated_at"     TIMESTAMPTZ;

-- FK to Supabase auth.users (enforced at app layer; Prisma does not cross-schema FKs)
-- ALTER TABLE "user_account" ADD CONSTRAINT "user_account_auth_user_id_fkey"
--   FOREIGN KEY ("auth_user_id") REFERENCES auth.users(id) ON DELETE SET NULL;

-- Partial index — only non-null values
CREATE INDEX IF NOT EXISTS "user_account_auth_user_id_idx"
  ON "user_account" ("auth_user_id")
  WHERE "auth_user_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "user_account_auth_migration_state_idx"
  ON "user_account" ("auth_migration_state");

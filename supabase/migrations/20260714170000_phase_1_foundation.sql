CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "SocietyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "AccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'ARCHIVED');
CREATE TYPE "AuditOutcome" AS ENUM ('SUCCESS', 'FAILURE', 'DENIED');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

CREATE TABLE "society" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "slug" VARCHAR(80) NOT NULL, "name" VARCHAR(160) NOT NULL, "time_zone" VARCHAR(80) NOT NULL DEFAULT 'Asia/Karachi', "currency" CHAR(3) NOT NULL DEFAULT 'PKR', "status" "SocietyStatus" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archived_at" TIMESTAMPTZ(6), "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "society_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "society_slug_key" ON "society"("slug");
CREATE INDEX "society_status_idx" ON "society"("status");

CREATE TABLE "user_account" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "username" VARCHAR(100) NOT NULL, "normalized_username" VARCHAR(100) NOT NULL, "email" VARCHAR(254), "normalized_email" VARCHAR(254), "display_name" VARCHAR(160) NOT NULL, "password_hash" VARCHAR(255) NOT NULL, "status" "AccountStatus" NOT NULL DEFAULT 'INVITED', "force_password_change" BOOLEAN NOT NULL DEFAULT true, "email_verified" BOOLEAN NOT NULL DEFAULT false, "failed_login_count" INTEGER NOT NULL DEFAULT 0, "locked_until" TIMESTAMPTZ(6), "last_login_at" TIMESTAMPTZ(6), "password_changed_at" TIMESTAMPTZ(6), "archived_at" TIMESTAMPTZ(6), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "user_account_pkey" PRIMARY KEY ("id"), CONSTRAINT "user_account_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT);
CREATE UNIQUE INDEX "user_account_normalized_username_key" ON "user_account"("normalized_username");
CREATE UNIQUE INDEX "user_account_normalized_email_key" ON "user_account"("normalized_email");
CREATE INDEX "user_account_society_id_status_idx" ON "user_account"("society_id", "status");

CREATE TABLE "role" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "code" VARCHAR(80) NOT NULL, "display_name" VARCHAR(120) NOT NULL, "description" VARCHAR(300), "system_role" BOOLEAN NOT NULL DEFAULT false, "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "role_pkey" PRIMARY KEY ("id"), CONSTRAINT "role_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT);
CREATE UNIQUE INDEX "uk_role_society_code" ON "role"("society_id", "code");
CREATE INDEX "role_society_id_active_idx" ON "role"("society_id", "active");

CREATE TABLE "permission" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(120) NOT NULL, "description" VARCHAR(300) NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "permission_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "permission_code_key" ON "permission"("code");

CREATE TABLE "role_permission" ("role_id" UUID NOT NULL, "permission_id" UUID NOT NULL, "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id", "permission_id"), CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE, CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE RESTRICT);
CREATE TABLE "user_role" ("society_id" UUID NOT NULL, "user_id" UUID NOT NULL, "role_id" UUID NOT NULL, "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "user_role_pkey" PRIMARY KEY ("society_id", "user_id", "role_id"), CONSTRAINT "user_role_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT, CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE, CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT);
CREATE INDEX "user_role_user_id_idx" ON "user_role"("user_id");
CREATE INDEX "user_role_role_id_idx" ON "user_role"("role_id");

CREATE TABLE "user_session" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "user_id" UUID NOT NULL, "token_hash" CHAR(64) NOT NULL, "csrf_token_hash" CHAR(64) NOT NULL, "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expires_at" TIMESTAMPTZ(6) NOT NULL, "revoked_at" TIMESTAMPTZ(6), "revoked_reason" VARCHAR(200), "source_ip" VARCHAR(64), "user_agent" VARCHAR(500), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "user_session_pkey" PRIMARY KEY ("id"), CONSTRAINT "user_session_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT, CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE);
CREATE UNIQUE INDEX "user_session_token_hash_key" ON "user_session"("token_hash");
CREATE INDEX "user_session_user_id_revoked_at_expires_at_idx" ON "user_session"("user_id", "revoked_at", "expires_at");
CREATE INDEX "user_session_society_id_expires_at_idx" ON "user_session"("society_id", "expires_at");

CREATE TABLE "password_reset_token" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "token_hash" CHAR(64) NOT NULL, "expires_at" TIMESTAMPTZ(6) NOT NULL, "used_at" TIMESTAMPTZ(6), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id"), CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE);
CREATE UNIQUE INDEX "password_reset_token_token_hash_key" ON "password_reset_token"("token_hash");
CREATE INDEX "password_reset_token_user_id_expires_at_idx" ON "password_reset_token"("user_id", "expires_at");

CREATE TABLE "system_setting" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "society_id" UUID, "setting_key" VARCHAR(160) NOT NULL, "value_type" VARCHAR(30) NOT NULL, "setting_value" TEXT, "secret_reference" VARCHAR(255), "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archived_at" TIMESTAMPTZ(6), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id"), CONSTRAINT "system_setting_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT);
CREATE INDEX "system_setting_society_id_setting_key_archived_at_idx" ON "system_setting"("society_id", "setting_key", "archived_at");

CREATE TABLE "audit_log" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "society_id" UUID, "actor_user_id" UUID, "action" VARCHAR(120) NOT NULL, "target_type" VARCHAR(100), "target_id" VARCHAR(100), "outcome" "AuditOutcome" NOT NULL, "reason" VARCHAR(500), "correlation_id" VARCHAR(100), "safe_metadata" JSONB NOT NULL DEFAULT '{}', "source_ip" VARCHAR(64), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id"), CONSTRAINT "audit_log_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT, CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL);
CREATE INDEX "audit_log_society_id_created_at_idx" ON "audit_log"("society_id", "created_at");
CREATE INDEX "audit_log_actor_user_id_created_at_idx" ON "audit_log"("actor_user_id", "created_at");
CREATE INDEX "audit_log_action_created_at_idx" ON "audit_log"("action", "created_at");

CREATE TABLE "outbox_event" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "aggregate_type" VARCHAR(100) NOT NULL, "aggregate_id" VARCHAR(100) NOT NULL, "event_type" VARCHAR(160) NOT NULL, "payload" JSONB NOT NULL, "deduplication_key" VARCHAR(180) NOT NULL, "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING', "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processed_at" TIMESTAMPTZ(6), "failed_attempts" INTEGER NOT NULL DEFAULT 0, "last_error" VARCHAR(1000), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "outbox_event_deduplication_key_key" ON "outbox_event"("deduplication_key");
CREATE INDEX "outbox_event_status_available_at_idx" ON "outbox_event"("status", "available_at");

ALTER TABLE "user_account" ADD CONSTRAINT "user_account_failed_login_count_check" CHECK ("failed_login_count" >= 0);
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_expiry_check" CHECK ("expires_at" > "issued_at");
ALTER TABLE "outbox_event" ADD CONSTRAINT "outbox_event_failed_attempts_check" CHECK ("failed_attempts" >= 0);

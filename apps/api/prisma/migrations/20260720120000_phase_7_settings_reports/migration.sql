-- CreateEnum
CREATE TYPE "ProfileCorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "financial_setting_period" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "default_monthly_fee" DECIMAL(18,2) NOT NULL,
    "due_day" INTEGER NOT NULL,
    "grace_period_days" INTEGER NOT NULL DEFAULT 0,
    "late_fee_policy" JSONB NOT NULL,
    "allocation_strategy" "AllocationStrategy" NOT NULL DEFAULT 'OLDEST_DUE_FIRST',
    "receipt_prefix" VARCHAR(20) NOT NULL,
    "receipt_sequence_start" INTEGER NOT NULL DEFAULT 1,
    "payment_instructions" TEXT,
    "supported_payment_methods" JSONB NOT NULL,
    "bank_transfer_instructions" TEXT,
    "advance_payment_policy" JSONB NOT NULL,
    "refund_and_reversal_policy" JSONB NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "rounding_scale" INTEGER NOT NULL DEFAULT 2,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "archived_at" TIMESTAMPTZ(6),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "financial_setting_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_correction_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "requested_by_user_id" UUID NOT NULL,
    "request_type" VARCHAR(80) NOT NULL,
    "requested_changes" JSONB NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "status" "ProfileCorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "resolution_note" VARCHAR(1000),
    "resolved_by_user_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "profile_correction_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_setting_period_society_id_archived_at_effective_f_idx" ON "financial_setting_period"("society_id", "archived_at", "effective_from", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "financial_setting_period_society_id_effective_from_key" ON "financial_setting_period"("society_id", "effective_from");

-- CreateIndex
CREATE INDEX "profile_correction_request_society_id_status_created_at_idx" ON "profile_correction_request"("society_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "profile_correction_request_resident_id_created_at_idx" ON "profile_correction_request"("resident_id", "created_at");

-- AddForeignKey
ALTER TABLE "financial_setting_period" ADD CONSTRAINT "financial_setting_period_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_setting_period" ADD CONSTRAINT "financial_setting_period_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_correction_request" ADD CONSTRAINT "profile_correction_request_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_correction_request" ADD CONSTRAINT "profile_correction_request_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_correction_request" ADD CONSTRAINT "profile_correction_request_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_correction_request" ADD CONSTRAINT "profile_correction_request_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Register Phase 7 authorization codes without relying on development seeding.
INSERT INTO "permission" ("id", "code", "description", "created_at", "updated_at", "version")
VALUES
  (gen_random_uuid(), 'REPORT_READ', 'read society-scoped operational reports', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  (gen_random_uuid(), 'REPORT_EXPORT', 'export authorized society-scoped reports', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  (gen_random_uuid(), 'PROFILE_CORRECTION_MANAGE', 'review protected resident profile correction requests', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permission" ("role_id", "permission_id", "granted_at")
SELECT role."id", permission."id", CURRENT_TIMESTAMP
FROM "role"
JOIN "permission" ON permission."code" IN ('REPORT_READ', 'REPORT_EXPORT')
WHERE role."code" IN ('SUPER_ADMINISTRATOR', 'ADMINISTRATOR', 'ACCOUNTS_MANAGER', 'MAINTENANCE_MANAGER')
ON CONFLICT DO NOTHING;

INSERT INTO "role_permission" ("role_id", "permission_id", "granted_at")
SELECT role."id", permission."id", CURRENT_TIMESTAMP
FROM "role"
JOIN "permission" ON permission."code" = 'PROFILE_CORRECTION_MANAGE'
WHERE role."code" IN ('SUPER_ADMINISTRATOR', 'ADMINISTRATOR')
ON CONFLICT DO NOTHING;

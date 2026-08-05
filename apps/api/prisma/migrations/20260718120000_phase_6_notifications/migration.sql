-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PROCESSING', 'PARTIALLY_SENT', 'SENT', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'PROCESSING', 'ACCEPTED', 'DELIVERED', 'FAILED', 'RETRYING', 'SKIPPED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RecipientReadStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "FailureClassification" AS ENUM ('TEMPORARY', 'PERMANENT', 'INVALID_RECIPIENT', 'PROVIDER_DISABLED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AudienceType" AS ENUM ('ALL_RESIDENTS', 'SELECTED_RESIDENTS', 'SELECTED_BLOCKS', 'SELECTED_UNITS', 'OWNERS', 'TENANTS', 'STAFF', 'WORKERS', 'ADMINISTRATORS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "JobClaimStatus" AS ENUM ('CLAIMED', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "notification_template" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "notification_type" VARCHAR(120) NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "language" VARCHAR(16) NOT NULL DEFAULT 'en',
    "allowed_variables" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "published_version" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "subject_template" VARCHAR(300),
    "message_template" TEXT NOT NULL,
    "allowed_variables" JSONB NOT NULL,
    "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by_user_id" UUID NOT NULL,

    CONSTRAINT "notification_template_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_batch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "kind" VARCHAR(80) NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'DRAFT',
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "recipient_snapshot" JSONB NOT NULL DEFAULT '[]',
    "estimated_count" INTEGER NOT NULL DEFAULT 0,
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "idempotency_key" VARCHAR(180) NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "batch_id" UUID,
    "template_version_id" UUID,
    "announcement_id" UUID,
    "notification_type" VARCHAR(120) NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "subject" VARCHAR(300),
    "rendered_content" TEXT NOT NULL,
    "related_type" VARCHAR(100),
    "related_id" VARCHAR(100),
    "status" "NotificationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "idempotency_key" VARCHAR(180) NOT NULL,
    "correlation_id" VARCHAR(100),
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipient" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "resident_id" UUID,
    "read_status" "RecipientReadStatus" NOT NULL DEFAULT 'UNREAD',
    "read_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "acknowledged_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipient_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "destination_masked" VARCHAR(180),
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "failure_classification" "FailureClassification",
    "failure_reason" VARCHAR(1000),
    "idempotency_key" VARCHAR(180) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_attempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delivery_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "failure_classification" "FailureClassification",
    "safe_response" VARCHAR(1000),
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "delivery_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_provider_reference" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delivery_id" UUID NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "provider_reference" VARCHAR(180) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_provider_reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "payment_reminders" BOOLEAN NOT NULL DEFAULT true,
    "general_announcements" BOOLEAN NOT NULL DEFAULT true,
    "maintenance_updates" BOOLEAN NOT NULL DEFAULT true,
    "complaint_updates" BOOLEAN NOT NULL DEFAULT true,
    "optional_events" BOOLEAN NOT NULL DEFAULT true,
    "preferred_language" VARCHAR(16) NOT NULL DEFAULT 'en',
    "quiet_hours_start" INTEGER,
    "quiet_hours_end" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_or_preference_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "preference_id" UUID NOT NULL,
    "changed_by_user_id" UUID NOT NULL,
    "changes" JSONB NOT NULL,
    "policy_basis" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_or_preference_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_schedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "time_zone" VARCHAR(80) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancellation_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "subject" VARCHAR(300) NOT NULL,
    "message" TEXT NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "channels" JSONB NOT NULL,
    "publish_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "requires_acknowledgment" BOOLEAN NOT NULL DEFAULT false,
    "emergency" BOOLEAN NOT NULL DEFAULT false,
    "correction_of_id" UUID,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_audience" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "announcement_id" UUID NOT NULL,
    "type" "AudienceType" NOT NULL,
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "exclusions" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "announcement_audience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_audience_snapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "announcement_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "resident_id" UUID,
    "channels" JSONB NOT NULL,
    "exclusion_reason" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_audience_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_attachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "announcement_id" UUID NOT NULL,
    "object_key" VARCHAR(500) NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "media_type" VARCHAR(120) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum_sha256" CHAR(64) NOT NULL,
    "uploaded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "announcement_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_callback_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delivery_id" UUID NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "callback_id" VARCHAR(180) NOT NULL,
    "provider_reference" VARCHAR(180) NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "payload_hash" CHAR(64) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_callback_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_job_claim" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delivery_id" UUID,
    "outbox_event_id" UUID,
    "worker_id" VARCHAR(100) NOT NULL,
    "status" "JobClaimStatus" NOT NULL DEFAULT 'CLAIMED',
    "claimed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lease_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "safe_error" VARCHAR(1000),

    CONSTRAINT "notification_job_claim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_template_society_id_notification_type_channel__idx" ON "notification_template"("society_id", "notification_type", "channel", "active");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_society_id_name_channel_language_key" ON "notification_template"("society_id", "name", "channel", "language");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_version_template_id_version_number_key" ON "notification_template_version"("template_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "notification_batch_idempotency_key_key" ON "notification_batch"("idempotency_key");

-- CreateIndex
CREATE INDEX "notification_batch_society_id_status_created_at_idx" ON "notification_batch"("society_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_idempotency_key_key" ON "notification"("idempotency_key");

-- CreateIndex
CREATE INDEX "notification_society_id_status_scheduled_at_idx" ON "notification"("society_id", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "notification_society_id_notification_type_created_at_idx" ON "notification"("society_id", "notification_type", "created_at");

-- CreateIndex
CREATE INDEX "notification_recipient_user_id_read_status_created_at_idx" ON "notification_recipient"("user_id", "read_status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipient_notification_id_user_id_key" ON "notification_recipient"("notification_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_delivery_idempotency_key_key" ON "notification_delivery"("idempotency_key");

-- CreateIndex
CREATE INDEX "notification_delivery_status_next_attempt_at_created_at_idx" ON "notification_delivery"("status", "next_attempt_at", "created_at");

-- CreateIndex
CREATE INDEX "notification_delivery_channel_status_created_at_idx" ON "notification_delivery"("channel", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_attempt_delivery_id_attempt_number_key" ON "delivery_attempt"("delivery_id", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "notification_provider_reference_provider_provider_reference_key" ON "notification_provider_reference"("provider", "provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_user_id_key" ON "notification_preference"("user_id");

-- CreateIndex
CREATE INDEX "notification_preference_society_id_updated_at_idx" ON "notification_preference"("society_id", "updated_at");

-- CreateIndex
CREATE INDEX "consent_or_preference_history_preference_id_created_at_idx" ON "consent_or_preference_history"("preference_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_schedule_batch_id_key" ON "notification_schedule"("batch_id");

-- CreateIndex
CREATE INDEX "notification_schedule_scheduled_at_cancelled_at_idx" ON "notification_schedule"("scheduled_at", "cancelled_at");

-- CreateIndex
CREATE INDEX "announcement_society_id_status_publish_at_idx" ON "announcement"("society_id", "status", "publish_at");

-- CreateIndex
CREATE INDEX "announcement_society_id_emergency_created_at_idx" ON "announcement"("society_id", "emergency", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_audience_announcement_id_key" ON "announcement_audience"("announcement_id");

-- CreateIndex
CREATE INDEX "announcement_audience_snapshot_announcement_id_exclusion_re_idx" ON "announcement_audience_snapshot"("announcement_id", "exclusion_reason");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_audience_snapshot_announcement_id_user_id_key" ON "announcement_audience_snapshot"("announcement_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_attachment_object_key_key" ON "announcement_attachment"("object_key");

-- CreateIndex
CREATE INDEX "announcement_attachment_announcement_id_archived_at_idx" ON "announcement_attachment"("announcement_id", "archived_at");

-- CreateIndex
CREATE INDEX "provider_callback_event_provider_reference_received_at_idx" ON "provider_callback_event"("provider_reference", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "provider_callback_event_provider_callback_id_key" ON "provider_callback_event"("provider", "callback_id");

-- CreateIndex
CREATE INDEX "notification_job_claim_status_lease_expires_at_idx" ON "notification_job_claim"("status", "lease_expires_at");

-- CreateIndex
CREATE INDEX "notification_job_claim_delivery_id_claimed_at_idx" ON "notification_job_claim"("delivery_id", "claimed_at");

-- AddForeignKey
ALTER TABLE "notification_template" ADD CONSTRAINT "notification_template_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_template_version" ADD CONSTRAINT "notification_template_version_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_batch" ADD CONSTRAINT "notification_batch_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "notification_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "notification_template_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipient" ADD CONSTRAINT "notification_recipient_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipient" ADD CONSTRAINT "notification_recipient_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "notification_recipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempt" ADD CONSTRAINT "delivery_attempt_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "notification_delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_provider_reference" ADD CONSTRAINT "notification_provider_reference_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "notification_delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_or_preference_history" ADD CONSTRAINT "consent_or_preference_history_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "notification_preference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_schedule" ADD CONSTRAINT "notification_schedule_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "notification_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_audience" ADD CONSTRAINT "announcement_audience_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_audience_snapshot" ADD CONSTRAINT "announcement_audience_snapshot_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_attachment" ADD CONSTRAINT "announcement_attachment_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_callback_event" ADD CONSTRAINT "provider_callback_event_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "notification_delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_job_claim" ADD CONSTRAINT "notification_job_claim_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "notification_delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

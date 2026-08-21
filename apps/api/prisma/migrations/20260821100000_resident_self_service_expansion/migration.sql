-- CreateEnum
CREATE TYPE "ResidentRequestType" AS ENUM ('RESIDENCE_CERTIFICATE', 'MAINTENANCE_CLEARANCE', 'MOVE_OUT_NOC', 'PROPERTY_TRANSFER_CLEARANCE', 'RENOVATION_PERMISSION', 'CONTRACTOR_ENTRY', 'VEHICLE_STICKER', 'EVENT_PERMISSION', 'OTHER');

-- CreateEnum
CREATE TYPE "ResidentRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MoveInRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MoveOutRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'CLEARANCE_PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommunityEventType" AS ENUM ('SOCIETY_MEETING', 'AGM', 'MAINTENANCE', 'WATER_SHUTDOWN', 'POWER_MAINTENANCE', 'COMMUNITY_EVENT', 'PAYMENT_DEADLINE', 'FACILITY_CLOSURE', 'GENERAL');

-- CreateEnum
CREATE TYPE "CommunityEventStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CommunityEventVisibility" AS ENUM ('ALL_RESIDENTS', 'OWNERS_ONLY', 'TENANTS_ONLY');

-- AlterTable
ALTER TABLE "resident_document" ADD COLUMN     "document_number" VARCHAR(120),
ADD COLUMN     "expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "issued_at" TIMESTAMPTZ(6),
ADD COLUMN     "rejection_reason" VARCHAR(500),
ADD COLUMN     "verification_status" VARCHAR(40) NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verified_at" TIMESTAMPTZ(6),
ADD COLUMN     "verified_by_user_id" UUID;

-- CreateTable
CREATE TABLE "resident_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "property_id" UUID,
    "unit_id" UUID,
    "request_number" VARCHAR(80) NOT NULL,
    "request_type" "ResidentRequestType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "ResidentRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by_user_id" UUID,
    "rejection_reason" VARCHAR(500),
    "issued_document_object_key" VARCHAR(500),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resident_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "move_in_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "request_number" VARCHAR(80) NOT NULL,
    "occupancy_type" "OccupancyType" NOT NULL,
    "desired_move_in_date" DATE NOT NULL,
    "status" "MoveInRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by_user_id" UUID,
    "rejection_reason" VARCHAR(500),
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "move_in_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "move_out_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "request_number" VARCHAR(80) NOT NULL,
    "desired_move_out_date" DATE NOT NULL,
    "status" "MoveOutRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "dues_clearance_status" VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    "parking_clearance_status" VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by_user_id" UUID,
    "rejection_reason" VARCHAR(500),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "move_out_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "event_type" "CommunityEventType" NOT NULL,
    "location" VARCHAR(200),
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "status" "CommunityEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "visibility" "CommunityEventVisibility" NOT NULL DEFAULT 'ALL_RESIDENTS',
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "community_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contact" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "alternate_phone" VARCHAR(40),
    "description" VARCHAR(300),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "emergency_contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resident_request_request_number_key" ON "resident_request"("request_number");

-- CreateIndex
CREATE INDEX "resident_request_society_id_status_idx" ON "resident_request"("society_id", "status");

-- CreateIndex
CREATE INDEX "resident_request_resident_id_status_idx" ON "resident_request"("resident_id", "status");

-- CreateIndex
CREATE INDEX "resident_request_request_type_idx" ON "resident_request"("request_type");

-- CreateIndex
CREATE UNIQUE INDEX "move_in_request_request_number_key" ON "move_in_request"("request_number");

-- CreateIndex
CREATE INDEX "move_in_request_society_id_status_idx" ON "move_in_request"("society_id", "status");

-- CreateIndex
CREATE INDEX "move_in_request_resident_id_status_idx" ON "move_in_request"("resident_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "move_out_request_request_number_key" ON "move_out_request"("request_number");

-- CreateIndex
CREATE INDEX "move_out_request_society_id_status_idx" ON "move_out_request"("society_id", "status");

-- CreateIndex
CREATE INDEX "move_out_request_resident_id_status_idx" ON "move_out_request"("resident_id", "status");

-- CreateIndex
CREATE INDEX "community_event_society_id_status_starts_at_idx" ON "community_event"("society_id", "status", "starts_at");

-- CreateIndex
CREATE INDEX "emergency_contact_society_id_is_active_display_order_idx" ON "emergency_contact"("society_id", "is_active", "display_order");

-- AddForeignKey
ALTER TABLE "resident_request" ADD CONSTRAINT "resident_request_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resident_request" ADD CONSTRAINT "resident_request_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resident_request" ADD CONSTRAINT "resident_request_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resident_request" ADD CONSTRAINT "resident_request_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resident_request" ADD CONSTRAINT "resident_request_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_in_request" ADD CONSTRAINT "move_in_request_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_in_request" ADD CONSTRAINT "move_in_request_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_in_request" ADD CONSTRAINT "move_in_request_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_in_request" ADD CONSTRAINT "move_in_request_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_in_request" ADD CONSTRAINT "move_in_request_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_out_request" ADD CONSTRAINT "move_out_request_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_out_request" ADD CONSTRAINT "move_out_request_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_out_request" ADD CONSTRAINT "move_out_request_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_out_request" ADD CONSTRAINT "move_out_request_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_out_request" ADD CONSTRAINT "move_out_request_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_event" ADD CONSTRAINT "community_event_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_event" ADD CONSTRAINT "community_event_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contact" ADD CONSTRAINT "emergency_contact_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- CreateEnum
CREATE TYPE "FacilityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE');

-- CreateEnum
CREATE TYPE "FacilityBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "facility" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(200),
    "category" VARCHAR(80) NOT NULL,
    "capacity" INTEGER,
    "status" "FacilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "opening_time" VARCHAR(10) NOT NULL DEFAULT '08:00',
    "closing_time" VARCHAR(10) NOT NULL DEFAULT '22:00',
    "booking_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "advance_booking_days" INTEGER NOT NULL DEFAULT 7,
    "booking_fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deposit_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'PKR',
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "rules" TEXT,
    "cancellation_policy" TEXT,
    "image_object_key" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_blockout" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facility_blockout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_booking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "booking_date" DATE NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "guest_count" INTEGER,
    "purpose" VARCHAR(300),
    "status" "FacilityBookingStatus" NOT NULL DEFAULT 'PENDING',
    "booking_fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deposit_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'PKR',
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by_user_id" UUID,
    "cancellation_reason" VARCHAR(500),
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "facility_booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "facility_society_id_status_idx" ON "facility"("society_id", "status");

-- CreateIndex
CREATE INDEX "facility_blockout_society_id_facility_id_idx" ON "facility_blockout"("society_id", "facility_id");

-- CreateIndex
CREATE INDEX "facility_blockout_facility_id_starts_at_ends_at_idx" ON "facility_blockout"("facility_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "facility_booking_society_id_status_idx" ON "facility_booking"("society_id", "status");

-- CreateIndex
CREATE INDEX "facility_booking_facility_id_booking_date_idx" ON "facility_booking"("facility_id", "booking_date");

-- CreateIndex
CREATE INDEX "facility_booking_resident_id_status_idx" ON "facility_booking"("resident_id", "status");

-- CreateIndex
CREATE INDEX "facility_booking_starts_at_ends_at_idx" ON "facility_booking"("starts_at", "ends_at");

-- AddForeignKey
ALTER TABLE "facility" ADD CONSTRAINT "facility_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_blockout" ADD CONSTRAINT "facility_blockout_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_blockout" ADD CONSTRAINT "facility_blockout_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_blockout" ADD CONSTRAINT "facility_blockout_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_booking" ADD CONSTRAINT "facility_booking_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_booking" ADD CONSTRAINT "facility_booking_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_booking" ADD CONSTRAINT "facility_booking_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_booking" ADD CONSTRAINT "facility_booking_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_booking" ADD CONSTRAINT "facility_booking_cancelled_by_user_id_fkey" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Enable btree_gist extension for exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping active bookings
ALTER TABLE "facility_booking" ADD CONSTRAINT "no_overlapping_active_facility_bookings" EXCLUDE USING gist (
  facility_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
)
WHERE (status IN ('PENDING', 'CONFIRMED'));

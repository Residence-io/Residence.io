-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('RECEIVED', 'WAITING_COLLECTION', 'COLLECTED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParkingSpaceStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'RESERVED', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "ParkingPermitStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "parcel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "unit_id" UUID,
    "courier_name" VARCHAR(120) NOT NULL,
    "tracking_number" VARCHAR(120),
    "description" VARCHAR(500),
    "package_type" VARCHAR(100),
    "status" "ParcelStatus" NOT NULL DEFAULT 'RECEIVED',
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collected_at" TIMESTAMPTZ(6),
    "returned_at" TIMESTAMPTZ(6),
    "guard_user_id" UUID NOT NULL,
    "photo_object_key" VARCHAR(255),
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "parcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_space" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "property_id" UUID,
    "unit_id" UUID,
    "space_number" VARCHAR(80) NOT NULL,
    "location" VARCHAR(200),
    "type" VARCHAR(80) NOT NULL,
    "status" "ParkingSpaceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "parking_space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_permit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "parking_space_id" UUID,
    "permit_number" VARCHAR(80) NOT NULL,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMPTZ(6),
    "status" "ParkingPermitStatus" NOT NULL DEFAULT 'ACTIVE',
    "issued_by_user_id" UUID NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "parking_permit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parcel_society_id_received_at_idx" ON "parcel"("society_id", "received_at");

-- CreateIndex
CREATE INDEX "parcel_resident_id_status_idx" ON "parcel"("resident_id", "status");

-- CreateIndex
CREATE INDEX "parcel_tracking_number_idx" ON "parcel"("tracking_number");

-- CreateIndex
CREATE INDEX "parcel_guard_user_id_idx" ON "parcel"("guard_user_id");

-- CreateIndex
CREATE INDEX "parking_space_society_id_status_idx" ON "parking_space"("society_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "parking_space_society_id_space_number_key" ON "parking_space"("society_id", "space_number");

-- CreateIndex
CREATE UNIQUE INDEX "parking_permit_permit_number_key" ON "parking_permit"("permit_number");

-- CreateIndex
CREATE INDEX "parking_permit_society_id_status_idx" ON "parking_permit"("society_id", "status");

-- CreateIndex
CREATE INDEX "parking_permit_vehicle_id_idx" ON "parking_permit"("vehicle_id");

-- CreateIndex
CREATE INDEX "parking_permit_resident_id_idx" ON "parking_permit"("resident_id");

-- AddForeignKey
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_guard_user_id_fkey" FOREIGN KEY ("guard_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_space" ADD CONSTRAINT "parking_space_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_space" ADD CONSTRAINT "parking_space_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_space" ADD CONSTRAINT "parking_space_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_permit" ADD CONSTRAINT "parking_permit_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_permit" ADD CONSTRAINT "parking_permit_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_permit" ADD CONSTRAINT "parking_permit_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_permit" ADD CONSTRAINT "parking_permit_parking_space_id_fkey" FOREIGN KEY ("parking_space_id") REFERENCES "parking_space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_permit" ADD CONSTRAINT "parking_permit_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Add Partial Unique Constraints
CREATE UNIQUE INDEX "one_active_permit_per_space" ON "parking_permit" ("parking_space_id") WHERE "status" = 'ACTIVE' AND "parking_space_id" IS NOT NULL;
CREATE UNIQUE INDEX "one_active_permit_per_vehicle" ON "parking_permit" ("vehicle_id") WHERE "status" = 'ACTIVE';

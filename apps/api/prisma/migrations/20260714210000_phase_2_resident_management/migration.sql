CREATE TYPE "ResidentStatus" AS ENUM ('ACTIVE','SUSPENDED','MOVED_OUT','INACTIVE','ARCHIVED');
CREATE TYPE "Gender" AS ENUM ('FEMALE','MALE','OTHER','UNDISCLOSED');
CREATE TYPE "PropertyType" AS ENUM ('HOUSE','APARTMENT','PLOT','COMMERCIAL','OTHER');
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE','OCCUPIED','INACTIVE','ARCHIVED');
CREATE TYPE "OccupancyType" AS ENUM ('OWNER','TENANT');
CREATE TYPE "HouseholdMemberStatus" AS ENUM ('ACTIVE','MOVED_OUT','INACTIVE');
CREATE TYPE "ResidentDocumentCategory" AS ENUM ('PROFILE_PHOTOGRAPH','IDENTITY_DOCUMENT','OWNERSHIP_DOCUMENT','TENANCY_AGREEMENT','OTHER');
CREATE TYPE "ResidentDocumentStatus" AS ENUM ('ACTIVE','REPLACED','ARCHIVED');
CREATE TYPE "ResidentIDCardStatus" AS ENUM ('ACTIVE','REVOKED','EXPIRED');

CREATE TABLE "property" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "block" VARCHAR(80) NOT NULL,
 "street" VARCHAR(160), "property_number" VARCHAR(80) NOT NULL, "normalized_address_key" VARCHAR(320) NOT NULL,
 "type" "PropertyType" NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "archived_at" TIMESTAMPTZ(6),
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "property_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "property_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "uk_property_society_address" ON "property"("society_id","normalized_address_key");
CREATE INDEX "property_society_id_block_active_idx" ON "property"("society_id","block","active");

CREATE TABLE "unit" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(), "property_id" UUID NOT NULL, "unit_number" VARCHAR(80) NOT NULL,
 "normalized_unit_number" VARCHAR(80) NOT NULL, "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE',
 "parking_information" VARCHAR(300), "archived_at" TIMESTAMPTZ(6),
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "unit_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "unit_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "uk_unit_property_number" ON "unit"("property_id","normalized_unit_number");
CREATE INDEX "unit_property_id_status_idx" ON "unit"("property_id","status");

CREATE TABLE "resident" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "user_id" UUID, "resident_number" VARCHAR(80) NOT NULL,
 "full_name" VARCHAR(160) NOT NULL, "normalized_full_name" VARCHAR(160) NOT NULL, "guardian_name" VARCHAR(160),
 "date_of_birth" DATE, "gender" "Gender" NOT NULL DEFAULT 'UNDISCLOSED', "email" VARCHAR(254),
 "primary_phone" VARCHAR(30) NOT NULL, "alternate_phone" VARCHAR(30), "identity_ciphertext" TEXT,
 "identity_search_hash" CHAR(64), "identity_last_four" VARCHAR(4), "permanent_address" VARCHAR(500),
 "emergency_contact_name" VARCHAR(160), "emergency_contact_phone" VARCHAR(30), "profile_photograph_object_key" VARCHAR(500),
 "household_size" INTEGER NOT NULL DEFAULT 1, "status" "ResidentStatus" NOT NULL DEFAULT 'ACTIVE',
 "suspension_reason" VARCHAR(500), "archived_at" TIMESTAMPTZ(6),
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "resident_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "resident_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT,
 CONSTRAINT "resident_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT,
 CONSTRAINT "resident_household_size_check" CHECK ("household_size" >= 1)
);
CREATE UNIQUE INDEX "resident_user_id_key" ON "resident"("user_id");
CREATE UNIQUE INDEX "uk_resident_society_number" ON "resident"("society_id","resident_number");
CREATE INDEX "resident_society_id_status_resident_number_idx" ON "resident"("society_id","status","resident_number");
CREATE INDEX "resident_society_id_normalized_full_name_idx" ON "resident"("society_id","normalized_full_name");
CREATE INDEX "resident_society_id_primary_phone_idx" ON "resident"("society_id","primary_phone");
CREATE INDEX "resident_society_id_email_idx" ON "resident"("society_id","email");
CREATE INDEX "resident_society_id_identity_search_hash_idx" ON "resident"("society_id","identity_search_hash");

CREATE TABLE "resident_occupancy" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(), "resident_id" UUID NOT NULL, "unit_id" UUID NOT NULL,
 "occupancy_type" "OccupancyType" NOT NULL, "primary_resident" BOOLEAN NOT NULL DEFAULT true,
 "start_date" DATE NOT NULL, "end_date" DATE, "move_out_reason" VARCHAR(500), "property_owner_name" VARCHAR(160),
 "property_owner_phone" VARCHAR(30), "property_owner_email" VARCHAR(254), "tenancy_start_date" DATE, "tenancy_end_date" DATE,
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "resident_occupancy_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "resident_occupancy_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT,
 CONSTRAINT "resident_occupancy_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT,
 CONSTRAINT "resident_occupancy_dates_check" CHECK ("end_date" IS NULL OR "end_date" >= "start_date"),
 CONSTRAINT "resident_occupancy_tenancy_dates_check" CHECK ("tenancy_end_date" IS NULL OR "tenancy_start_date" IS NULL OR "tenancy_end_date" >= "tenancy_start_date")
);
CREATE INDEX "resident_occupancy_resident_id_start_date_idx" ON "resident_occupancy"("resident_id","start_date");
CREATE INDEX "resident_occupancy_unit_id_end_date_idx" ON "resident_occupancy"("unit_id","end_date");
CREATE UNIQUE INDEX "resident_occupancy_one_active_primary_unit" ON "resident_occupancy"("unit_id") WHERE "end_date" IS NULL AND "primary_resident"=true;
CREATE UNIQUE INDEX "resident_occupancy_one_active_resident" ON "resident_occupancy"("resident_id") WHERE "end_date" IS NULL;

CREATE TABLE "household_member" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(), "resident_id" UUID NOT NULL, "full_name" VARCHAR(160) NOT NULL,
 "relationship" VARCHAR(80) NOT NULL, "date_of_birth" DATE, "gender" "Gender" NOT NULL DEFAULT 'UNDISCLOSED',
 "phone" VARCHAR(30), "identity_last_four" VARCHAR(4), "emergency_contact" BOOLEAN NOT NULL DEFAULT false,
 "status" "HouseholdMemberStatus" NOT NULL DEFAULT 'ACTIVE', "moved_out_at" DATE,
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "household_member_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "household_member_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT
);
CREATE INDEX "household_member_resident_id_status_idx" ON "household_member"("resident_id","status");

CREATE TABLE "vehicle" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(), "resident_id" UUID NOT NULL, "type" VARCHAR(80) NOT NULL,
 "manufacturer" VARCHAR(100), "model" VARCHAR(100), "colour" VARCHAR(60), "registration_number" VARCHAR(40) NOT NULL,
 "normalized_registration_number" VARCHAR(40) NOT NULL, "parking_permit_number" VARCHAR(80), "parking_location" VARCHAR(160),
 "active" BOOLEAN NOT NULL DEFAULT true, "deactivated_at" TIMESTAMPTZ(6),
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "vehicle_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT
);
CREATE INDEX "vehicle_resident_id_active_idx" ON "vehicle"("resident_id","active");
CREATE INDEX "vehicle_normalized_registration_number_active_idx" ON "vehicle"("normalized_registration_number","active");
CREATE UNIQUE INDEX "vehicle_active_registration_unique" ON "vehicle"("normalized_registration_number") WHERE "active"=true;

CREATE TABLE "resident_document" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(), "resident_id" UUID NOT NULL, "category" "ResidentDocumentCategory" NOT NULL,
 "status" "ResidentDocumentStatus" NOT NULL DEFAULT 'ACTIVE', "object_key" VARCHAR(500) NOT NULL,
 "original_file_name" VARCHAR(255) NOT NULL, "media_type" VARCHAR(120) NOT NULL, "size_bytes" BIGINT NOT NULL,
 "checksum_sha256" CHAR(64) NOT NULL, "uploaded_by_user_id" UUID NOT NULL, "replaced_by_id" UUID, "archived_at" TIMESTAMPTZ(6),
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "resident_document_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "resident_document_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT,
 CONSTRAINT "resident_document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT,
 CONSTRAINT "resident_document_replaced_by_fkey" FOREIGN KEY ("replaced_by_id") REFERENCES "resident_document"("id") ON DELETE RESTRICT,
 CONSTRAINT "resident_document_size_check" CHECK ("size_bytes">0)
);
CREATE UNIQUE INDEX "resident_document_object_key_key" ON "resident_document"("object_key");
CREATE INDEX "resident_document_resident_id_category_status_idx" ON "resident_document"("resident_id","category","status");

CREATE TABLE "resident_fee_assignment" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(), "resident_id" UUID NOT NULL, "monthly_amount" DECIMAL(19,4) NOT NULL,
 "security_deposit" DECIMAL(19,4), "currency" CHAR(3) NOT NULL, "effective_from" DATE NOT NULL, "effective_to" DATE,
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "version" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "resident_fee_assignment_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "resident_fee_assignment_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT,
 CONSTRAINT "resident_fee_amount_check" CHECK ("monthly_amount">=0 AND ("security_deposit" IS NULL OR "security_deposit">=0)),
 CONSTRAINT "resident_fee_dates_check" CHECK ("effective_to" IS NULL OR "effective_to">="effective_from")
);
CREATE INDEX "resident_fee_assignment_resident_id_effective_idx" ON "resident_fee_assignment"("resident_id","effective_from","effective_to");

CREATE TABLE "resident_id_card" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(), "resident_id" UUID NOT NULL, "card_number" VARCHAR(100) NOT NULL,
 "verification_hash" CHAR(64) NOT NULL, "pdf_object_key" VARCHAR(500) NOT NULL,
 "status" "ResidentIDCardStatus" NOT NULL DEFAULT 'ACTIVE', "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "expires_at" TIMESTAMPTZ(6), "revoked_at" TIMESTAMPTZ(6), "revocation_reason" VARCHAR(500),
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "version" INTEGER NOT NULL DEFAULT 0,
 CONSTRAINT "resident_id_card_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "resident_id_card_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "resident_id_card_card_number_key" ON "resident_id_card"("card_number");
CREATE UNIQUE INDEX "resident_id_card_verification_hash_key" ON "resident_id_card"("verification_hash");
CREATE INDEX "resident_id_card_resident_id_status_issued_at_idx" ON "resident_id_card"("resident_id","status","issued_at");
CREATE UNIQUE INDEX "resident_id_card_one_active" ON "resident_id_card"("resident_id") WHERE "status"='ACTIVE';

CREATE TABLE "resident_id_sequence" (
 "society_id" UUID NOT NULL, "sequence_year" INTEGER NOT NULL, "next_value" BIGINT NOT NULL DEFAULT 1,
 "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "resident_id_sequence_pkey" PRIMARY KEY ("society_id","sequence_year"),
 CONSTRAINT "resident_id_sequence_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT,
 CONSTRAINT "resident_id_sequence_value_check" CHECK ("next_value">0)
);

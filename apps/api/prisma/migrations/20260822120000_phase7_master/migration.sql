-- Phase 7 Master Migration: Asset Management, Inventory / Stores, Polls & Voting
-- Additive forward migration (Migration 19)

-- 1. ENUMS
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED', 'DISPOSED');
CREATE TYPE "AssetCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'SCRAP');
CREATE TYPE "AssetCategory" AS ENUM ('GENERATOR', 'ELEVATOR', 'PUMP', 'CCTV_CAMERA', 'SECURITY_GATE', 'HVAC', 'FIRE_SAFETY', 'GYM_EQUIPMENT', 'ELECTRICAL_PANEL', 'CLEANING_EQUIPMENT', 'OTHER');

CREATE TYPE "InventoryMovementType" AS ENUM ('OPENING_BALANCE', 'RECEIPT', 'ISSUE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURN');

CREATE TYPE "PollType" AS ENUM ('GENERAL', 'SURVEY', 'AGM', 'RESOLUTION');
CREATE TYPE "PollStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'CANCELLED');
CREATE TYPE "PollEligibility" AS ENUM ('ALL_ACTIVE_RESIDENTS', 'OWNERS_ONLY', 'TENANTS_ONLY');

-- 2. ASSET MANAGEMENT TABLES
CREATE TABLE "asset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "asset_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "category" "AssetCategory" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "location" VARCHAR(300),
    "manufacturer" VARCHAR(160),
    "model" VARCHAR(160),
    "serial_number" VARCHAR(160),
    "purchase_date" DATE,
    "purchase_cost" DECIMAL(14,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "warranty_expiry" DATE,
    "facility_id" UUID,
    "vendor_id" UUID,
    "assigned_worker_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uk_asset_society_code" UNIQUE ("society_id", "asset_code"),
    CONSTRAINT "asset_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "asset_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asset_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "asset_assigned_worker_id_fkey" FOREIGN KEY ("assigned_worker_id") REFERENCES "service_worker"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "asset_asset_code_key" ON "asset"("asset_code");
CREATE INDEX "asset_society_id_category_idx" ON "asset"("society_id", "category");
CREATE INDEX "asset_society_id_status_idx" ON "asset"("society_id", "status");
CREATE INDEX "asset_facility_id_idx" ON "asset"("facility_id");
CREATE INDEX "asset_vendor_id_idx" ON "asset"("vendor_id");
CREATE INDEX "asset_assigned_worker_id_idx" ON "asset"("assigned_worker_id");

CREATE TABLE "asset_document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asset_id" UUID NOT NULL,
    "object_key" VARCHAR(500) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "media_type" VARCHAR(120) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum_sha256" CHAR(64) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "uploaded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_document_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "asset_document_object_key_key" UNIQUE ("object_key"),
    CONSTRAINT "asset_document_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "asset_document_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "asset_document_asset_id_category_idx" ON "asset_document"("asset_id", "category");

CREATE TABLE "asset_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asset_id" UUID NOT NULL,
    "from_status" "AssetStatus",
    "to_status" "AssetStatus" NOT NULL,
    "reason" VARCHAR(500),
    "acted_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_status_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "asset_status_history_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "asset_status_history_acted_by_user_id_fkey" FOREIGN KEY ("acted_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "asset_status_history_asset_id_created_at_idx" ON "asset_status_history"("asset_id", "created_at");

-- 3. INVENTORY / STORES TABLES
CREATE TABLE "inventory_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(80) NOT NULL,
    "unit_of_measure" VARCHAR(30) NOT NULL,
    "minimum_quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reorder_level" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "current_quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "default_vendor_id" UUID,
    "unit_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'PKR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_item_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uk_inventory_item_society_sku" UNIQUE ("society_id", "sku"),
    CONSTRAINT "inventory_item_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_item_default_vendor_id_fkey" FOREIGN KEY ("default_vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "inventory_item_society_id_category_idx" ON "inventory_item"("society_id", "category");

CREATE TABLE "inventory_movement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit_cost" DECIMAL(14,2),
    "reference" VARCHAR(120),
    "maintenance_request_id" UUID,
    "vendor_id" UUID,
    "notes" TEXT,
    "created_by_user_id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_movement_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_movement_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_movement_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "inventory_movement_maintenance_request_id_fkey" FOREIGN KEY ("maintenance_request_id") REFERENCES "maintenance_request"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "inventory_movement_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "inventory_movement_society_id_occurred_at_idx" ON "inventory_movement"("society_id", "occurred_at");
CREATE INDEX "inventory_movement_inventory_item_id_occurred_at_idx" ON "inventory_movement"("inventory_item_id", "occurred_at");
CREATE INDEX "inventory_movement_society_id_type_idx" ON "inventory_movement"("society_id", "type");
CREATE INDEX "inventory_movement_maintenance_request_id_idx" ON "inventory_movement"("maintenance_request_id");

-- 4. POLLS & VOTING TABLES (BALLOT ARCHITECTURE)
CREATE TABLE "poll" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "PollType" NOT NULL,
    "status" "PollStatus" NOT NULL DEFAULT 'DRAFT',
    "opens_at" TIMESTAMPTZ(6) NOT NULL,
    "closes_at" TIMESTAMPTZ(6) NOT NULL,
    "eligibility" "PollEligibility" NOT NULL DEFAULT 'ALL_ACTIVE_RESIDENTS',
    "allow_multiple" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" UUID NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "poll_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "poll_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "poll_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "poll_society_id_status_idx" ON "poll"("society_id", "status");
CREATE INDEX "poll_society_id_opens_at_closes_at_idx" ON "poll"("society_id", "opens_at", "closes_at");
CREATE INDEX "poll_created_by_user_id_idx" ON "poll"("created_by_user_id");

CREATE TABLE "poll_option" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "poll_id" UUID NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_option_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "poll_option_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "poll_option_poll_id_sort_order_idx" ON "poll_option"("poll_id", "sort_order");

CREATE TABLE "poll_ballot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "poll_id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_ballot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uk_poll_ballot_poll_resident" UNIQUE ("poll_id", "resident_id"),
    CONSTRAINT "poll_ballot_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "poll_ballot_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "poll_ballot_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "poll_ballot_society_id_poll_id_idx" ON "poll_ballot"("society_id", "poll_id");
CREATE INDEX "poll_ballot_resident_id_idx" ON "poll_ballot"("resident_id");

CREATE TABLE "poll_ballot_selection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ballot_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_ballot_selection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uk_poll_ballot_selection_unique" UNIQUE ("ballot_id", "option_id"),
    CONSTRAINT "poll_ballot_selection_ballot_id_fkey" FOREIGN KEY ("ballot_id") REFERENCES "poll_ballot"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "poll_ballot_selection_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "poll_option"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "poll_ballot_selection_option_id_idx" ON "poll_ballot_selection"("option_id");

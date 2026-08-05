CREATE TYPE "FeePlanScope" AS ENUM ('SOCIETY_DEFAULT','PROPERTY_TYPE','UNIT');
CREATE TYPE "LateFeeType" AS ENUM ('NONE','FIXED','PERCENTAGE');
CREATE TYPE "DueStatus" AS ENUM ('UPCOMING','PENDING','PARTIALLY_PAID','PAID','OVERDUE','WAIVED','CANCELLED','UNDER_REVIEW');
CREATE TYPE "DueLineItemType" AS ENUM ('PRINCIPAL','LATE_FEE','DEBIT_ADJUSTMENT','DISCOUNT','WAIVER');
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT','CREDIT');
CREATE TYPE "LedgerEntryType" AS ENUM ('OPENING_BALANCE','MONTHLY_DUE','LATE_FEE','PAYMENT','DISCOUNT','WAIVER','DEBIT_ADJUSTMENT','CREDIT_ADJUSTMENT','REVERSAL','REFUND','ADVANCE_CREDIT','ADVANCE_APPLIED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH','BANK_TRANSFER','CARD_PROVIDER','DIGITAL_WALLET','CHEQUE','OTHER');
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED','PENDING_VERIFICATION','CONFIRMED','FAILED','CANCELLED','REVERSED','PARTIALLY_REFUNDED','REFUNDED');
CREATE TYPE "AllocationStrategy" AS ENUM ('OLDEST_DUE_FIRST','SELECTED_DUES','CURRENT_MONTH','ALL_OUTSTANDING','ADVANCE');
CREATE TYPE "FinancialBatchStatus" AS ENUM ('PREVIEWED','PROCESSING','COMPLETED','PARTIALLY_COMPLETED','FAILED');
CREATE TYPE "AdjustmentType" AS ENUM ('FIXED_DISCOUNT','PERCENTAGE_DISCOUNT','PARTIAL_WAIVER','FULL_WAIVER','DEBIT_ADJUSTMENT','CREDIT_ADJUSTMENT','CORRECTION');
CREATE TYPE "ReceiptStatus" AS ENUM ('ACTIVE','REVERSED');
CREATE TYPE "ProviderTransactionStatus" AS ENUM ('CREATED','PENDING','CONFIRMED','FAILED','CANCELLED','REFUNDED');
CREATE TYPE "RefundStatus" AS ENUM ('CONFIRMED','FAILED');

CREATE TABLE "fee_plan" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "unit_id" UUID,
  "property_type" "PropertyType", "name" VARCHAR(160) NOT NULL, "description" VARCHAR(500),
  "scope" "FeePlanScope" NOT NULL, "monthly_base_amount" DECIMAL(18,2) NOT NULL, "currency" CHAR(3) NOT NULL,
  "effective_from" DATE NOT NULL, "effective_to" DATE, "due_day" INTEGER NOT NULL DEFAULT 10,
  "grace_period_days" INTEGER NOT NULL DEFAULT 0, "late_fee_type" "LateFeeType" NOT NULL DEFAULT 'NONE',
  "late_fee_value" DECIMAL(18,2) NOT NULL DEFAULT 0, "late_fee_recurring" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true, "created_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "fee_plan_society_fk" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT,
  CONSTRAINT "fee_plan_unit_fk" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT,
  CONSTRAINT "fee_plan_creator_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT,
  CONSTRAINT "fee_plan_scope_fields" CHECK (("scope"='UNIT' AND "unit_id" IS NOT NULL AND "property_type" IS NULL) OR ("scope"='PROPERTY_TYPE' AND "property_type" IS NOT NULL AND "unit_id" IS NULL) OR ("scope"='SOCIETY_DEFAULT' AND "unit_id" IS NULL AND "property_type" IS NULL)),
  CONSTRAINT "fee_plan_dates" CHECK ("effective_to" IS NULL OR "effective_to">="effective_from"),
  CONSTRAINT "fee_plan_amount" CHECK ("monthly_base_amount">=0 AND "late_fee_value">=0),
  CONSTRAINT "fee_plan_due_day" CHECK ("due_day" BETWEEN 1 AND 28)
);
CREATE INDEX "fee_plan_society_scope_active_dates_idx" ON "fee_plan"("society_id","scope","active","effective_from","effective_to");
CREATE INDEX "fee_plan_unit_active_idx" ON "fee_plan"("unit_id","active");

CREATE TABLE "fee_plan_component" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "fee_plan_id" UUID NOT NULL, "name" VARCHAR(120) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL, "sort_order" INTEGER NOT NULL DEFAULT 0, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fee_plan_component_plan_fk" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plan"("id") ON DELETE RESTRICT
);
CREATE INDEX "fee_plan_component_plan_sort_idx" ON "fee_plan_component"("fee_plan_id","sort_order");

CREATE TABLE "late_fee_rule" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "fee_plan_id" UUID NOT NULL UNIQUE, "type" "LateFeeType" NOT NULL,
  "value" DECIMAL(18,2) NOT NULL, "recurring" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "late_fee_rule_plan_fk" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plan"("id") ON DELETE RESTRICT,
  CONSTRAINT "late_fee_rule_value" CHECK ("value">=0)
);

ALTER TABLE "resident_fee_assignment" ADD COLUMN "fee_plan_id" UUID;
ALTER TABLE "resident_fee_assignment" ADD COLUMN "assigned_by_user_id" UUID;
ALTER TABLE "resident_fee_assignment" ADD COLUMN "reason" VARCHAR(500);
ALTER TABLE "resident_fee_assignment" ADD CONSTRAINT "resident_fee_assignment_plan_fk" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plan"("id") ON DELETE RESTRICT;
ALTER TABLE "resident_fee_assignment" ADD CONSTRAINT "resident_fee_assignment_actor_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL;

CREATE TABLE "billing_period" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "year" INTEGER NOT NULL, "month" INTEGER NOT NULL,
  "starts_at" DATE NOT NULL, "ends_at" DATE NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_period_society_fk" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT,
  CONSTRAINT "billing_period_month" CHECK ("month" BETWEEN 1 AND 12),
  CONSTRAINT "billing_period_range" CHECK ("ends_at">="starts_at"),
  CONSTRAINT "uk_billing_period_society_month" UNIQUE ("society_id","year","month")
);

CREATE TABLE "financial_batch" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "billing_period_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(180) NOT NULL UNIQUE, "status" "FinancialBatchStatus" NOT NULL DEFAULT 'PROCESSING',
  "generated_count" INTEGER NOT NULL DEFAULT 0, "skipped_count" INTEGER NOT NULL DEFAULT 0, "failed_count" INTEGER NOT NULL DEFAULT 0,
  "created_by_user_id" UUID NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMPTZ(6),
  CONSTRAINT "financial_batch_society_fk" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT,
  CONSTRAINT "financial_batch_period_fk" FOREIGN KEY ("billing_period_id") REFERENCES "billing_period"("id") ON DELETE RESTRICT,
  CONSTRAINT "financial_batch_actor_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT
);
CREATE INDEX "financial_batch_society_created_idx" ON "financial_batch"("society_id","created_at");

CREATE TABLE "monthly_due" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "resident_id" UUID NOT NULL,
  "billing_period_id" UUID NOT NULL, "fee_plan_id" UUID, "financial_batch_id" UUID,
  "status" "DueStatus" NOT NULL DEFAULT 'PENDING', "currency" CHAR(3) NOT NULL,
  "principal_amount" DECIMAL(18,2) NOT NULL, "total_amount" DECIMAL(18,2) NOT NULL,
  "paid_amount" DECIMAL(18,2) NOT NULL DEFAULT 0, "waived_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "due_date" DATE NOT NULL, "grace_ends_at" DATE NOT NULL, "fee_plan_snapshot" JSONB NOT NULL, "unit_snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL, "version" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "monthly_due_society_fk" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT,
  CONSTRAINT "monthly_due_resident_fk" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT,
  CONSTRAINT "monthly_due_period_fk" FOREIGN KEY ("billing_period_id") REFERENCES "billing_period"("id") ON DELETE RESTRICT,
  CONSTRAINT "monthly_due_plan_fk" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plan"("id") ON DELETE RESTRICT,
  CONSTRAINT "monthly_due_batch_fk" FOREIGN KEY ("financial_batch_id") REFERENCES "financial_batch"("id") ON DELETE RESTRICT,
  CONSTRAINT "uk_due_resident_period" UNIQUE ("resident_id","billing_period_id"),
  CONSTRAINT "monthly_due_amounts" CHECK ("principal_amount">=0 AND "total_amount">=0 AND "paid_amount">=0 AND "waived_amount">=0)
);
CREATE INDEX "monthly_due_society_status_date_idx" ON "monthly_due"("society_id","status","due_date");
CREATE INDEX "monthly_due_resident_date_idx" ON "monthly_due"("resident_id","due_date");

CREATE TABLE "due_line_item" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "monthly_due_id" UUID NOT NULL, "type" "DueLineItemType" NOT NULL,
  "description" VARCHAR(240) NOT NULL, "amount" DECIMAL(18,2) NOT NULL, "calculation_snapshot" JSONB,
  "idempotency_key" VARCHAR(180) NOT NULL UNIQUE, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "due_line_item_due_fk" FOREIGN KEY ("monthly_due_id") REFERENCES "monthly_due"("id") ON DELETE RESTRICT
);
CREATE INDEX "due_line_item_due_type_idx" ON "due_line_item"("monthly_due_id","type");

CREATE TABLE "payment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "resident_id" UUID NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL, "currency" CHAR(3) NOT NULL, "payment_date" TIMESTAMPTZ(6) NOT NULL,
  "method" "PaymentMethod" NOT NULL, "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
  "transaction_reference" VARCHAR(180), "idempotency_key" VARCHAR(180) NOT NULL UNIQUE,
  "allocation_strategy" "AllocationStrategy" NOT NULL, "allocation_criteria" JSONB, "notes" VARCHAR(500), "recorded_by_user_id" UUID,
  "confirmed_at" TIMESTAMPTZ(6), "reversed_at" TIMESTAMPTZ(6), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL, "version" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "payment_society_fk" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT,
  CONSTRAINT "payment_resident_fk" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT,
  CONSTRAINT "payment_actor_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL,
  CONSTRAINT "uk_payment_society_reference" UNIQUE ("society_id","transaction_reference"),
  CONSTRAINT "payment_positive" CHECK ("amount">0)
);
CREATE INDEX "payment_society_status_date_idx" ON "payment"("society_id","status","payment_date");
CREATE INDEX "payment_resident_date_idx" ON "payment"("resident_id","payment_date");

CREATE TABLE "payment_allocation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "payment_id" UUID NOT NULL, "monthly_due_id" UUID NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_allocation_payment_fk" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT,
  CONSTRAINT "payment_allocation_due_fk" FOREIGN KEY ("monthly_due_id") REFERENCES "monthly_due"("id") ON DELETE RESTRICT,
  CONSTRAINT "uk_payment_due_allocation" UNIQUE ("payment_id","monthly_due_id"), CONSTRAINT "payment_allocation_positive" CHECK ("amount">0)
);
CREATE INDEX "payment_allocation_due_idx" ON "payment_allocation"("monthly_due_id");

CREATE TABLE "payment_proof" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "payment_id" UUID NOT NULL, "object_key" VARCHAR(500) NOT NULL UNIQUE,
  "original_file_name" VARCHAR(255) NOT NULL, "media_type" VARCHAR(120) NOT NULL, "size_bytes" BIGINT NOT NULL,
  "checksum_sha256" CHAR(64) NOT NULL, "reviewed_at" TIMESTAMPTZ(6), "reviewed_by_user_id" UUID,
  "rejection_reason" VARCHAR(500), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_proof_payment_fk" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT
);
CREATE INDEX "payment_proof_payment_created_idx" ON "payment_proof"("payment_id","created_at");

CREATE TABLE "payment_adjustment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "monthly_due_id" UUID NOT NULL, "type" "AdjustmentType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL, "currency" CHAR(3) NOT NULL, "reason" VARCHAR(500) NOT NULL,
  "acted_by_user_id" UUID NOT NULL, "idempotency_key" VARCHAR(180) NOT NULL UNIQUE, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_adjustment_due_fk" FOREIGN KEY ("monthly_due_id") REFERENCES "monthly_due"("id") ON DELETE RESTRICT,
  CONSTRAINT "payment_adjustment_actor_fk" FOREIGN KEY ("acted_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT
);
CREATE TABLE "discount_or_waiver" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "monthly_due_id" UUID NOT NULL, "type" "AdjustmentType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL, "currency" CHAR(3) NOT NULL, "reason" VARCHAR(500) NOT NULL,
  "acted_by_user_id" UUID NOT NULL, "idempotency_key" VARCHAR(180) NOT NULL UNIQUE, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "discount_waiver_due_fk" FOREIGN KEY ("monthly_due_id") REFERENCES "monthly_due"("id") ON DELETE RESTRICT,
  CONSTRAINT "discount_waiver_actor_fk" FOREIGN KEY ("acted_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT
);

CREATE TABLE "financial_ledger_entry" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "society_id" UUID NOT NULL, "resident_id" UUID NOT NULL,
  "monthly_due_id" UUID, "payment_id" UUID, "type" "LedgerEntryType" NOT NULL, "direction" "LedgerDirection" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL, "currency" CHAR(3) NOT NULL, "event_date" TIMESTAMPTZ(6) NOT NULL,
  "reference" VARCHAR(180) NOT NULL, "description" VARCHAR(300) NOT NULL, "idempotency_key" VARCHAR(180) NOT NULL UNIQUE,
  "reverses_entry_id" UUID, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_society_fk" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT,
  CONSTRAINT "ledger_resident_fk" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT,
  CONSTRAINT "ledger_due_fk" FOREIGN KEY ("monthly_due_id") REFERENCES "monthly_due"("id") ON DELETE RESTRICT,
  CONSTRAINT "ledger_payment_fk" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT,
  CONSTRAINT "ledger_positive" CHECK ("amount">0)
);
CREATE INDEX "ledger_resident_event_idx" ON "financial_ledger_entry"("resident_id","event_date","id");
CREATE INDEX "ledger_society_type_event_idx" ON "financial_ledger_entry"("society_id","type","event_date");

CREATE TABLE "payment_provider_transaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "payment_id" UUID NOT NULL, "provider" VARCHAR(80) NOT NULL,
  "provider_reference" VARCHAR(180), "provider_event_id" VARCHAR(180) UNIQUE, "status" "ProviderTransactionStatus" NOT NULL DEFAULT 'CREATED',
  "amount" DECIMAL(18,2) NOT NULL, "currency" CHAR(3) NOT NULL, "idempotency_key" VARCHAR(180) NOT NULL UNIQUE,
  "safe_response" JSONB, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "provider_transaction_payment_fk" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT
);
CREATE INDEX "provider_transaction_provider_status_idx" ON "payment_provider_transaction"("provider","status");

CREATE TABLE "payment_reversal" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "payment_id" UUID NOT NULL UNIQUE, "amount" DECIMAL(18,2) NOT NULL,
  "reason" VARCHAR(500) NOT NULL, "acted_by_user_id" UUID NOT NULL, "idempotency_key" VARCHAR(180) NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_reversal_payment_fk" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT,
  CONSTRAINT "payment_reversal_actor_fk" FOREIGN KEY ("acted_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT
);
CREATE TABLE "refund" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "payment_id" UUID NOT NULL, "amount" DECIMAL(18,2) NOT NULL,
  "currency" CHAR(3) NOT NULL, "status" "RefundStatus" NOT NULL DEFAULT 'CONFIRMED', "reason" VARCHAR(500) NOT NULL,
  "acted_by_user_id" UUID NOT NULL, "idempotency_key" VARCHAR(180) NOT NULL UNIQUE, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refund_payment_fk" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT,
  CONSTRAINT "refund_actor_fk" FOREIGN KEY ("acted_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT
);
CREATE INDEX "refund_payment_created_idx" ON "refund"("payment_id","created_at");

CREATE TABLE "resident_credit_balance" (
  "resident_id" UUID PRIMARY KEY, "amount" DECIMAL(18,2) NOT NULL DEFAULT 0, "currency" CHAR(3) NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL, "version" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "resident_credit_resident_fk" FOREIGN KEY ("resident_id") REFERENCES "resident"("id") ON DELETE RESTRICT
);
CREATE TABLE "receipt" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "payment_id" UUID NOT NULL UNIQUE, "receipt_number" VARCHAR(100) NOT NULL UNIQUE,
  "verification_hash" CHAR(64) NOT NULL UNIQUE, "pdf_object_key" VARCHAR(500) NOT NULL, "status" "ReceiptStatus" NOT NULL DEFAULT 'ACTIVE',
  "issued_by_user_id" UUID NOT NULL, "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reversed_at" TIMESTAMPTZ(6), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "version" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "receipt_payment_fk" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT,
  CONSTRAINT "receipt_issuer_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT
);
CREATE INDEX "receipt_status_issued_idx" ON "receipt"("status","issued_at");
CREATE TABLE "receipt_sequence" (
  "society_id" UUID NOT NULL, "sequence_year" INTEGER NOT NULL, "next_value" BIGINT NOT NULL DEFAULT 1,
  "updated_at" TIMESTAMPTZ(6) NOT NULL, PRIMARY KEY ("society_id","sequence_year"),
  CONSTRAINT "receipt_sequence_society_fk" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT
);

-- Financial facts are append-only. Prevent direct updates/deletes of posted ledger rows at the database boundary.
CREATE OR REPLACE FUNCTION prevent_financial_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'financial ledger entries are immutable'; END $$;
CREATE TRIGGER financial_ledger_no_update BEFORE UPDATE OR DELETE ON "financial_ledger_entry" FOR EACH ROW EXECUTE FUNCTION prevent_financial_ledger_mutation();

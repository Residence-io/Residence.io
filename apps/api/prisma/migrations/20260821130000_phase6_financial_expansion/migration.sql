-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('MAINTENANCE', 'SECURITY', 'CLEANING', 'UTILITIES', 'LANDSCAPING', 'SUPPLIES', 'CONTRACTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('UTILITIES', 'MAINTENANCE', 'SECURITY', 'SALARIES', 'CLEANING', 'LANDSCAPING', 'SUPPLIES', 'FACILITY', 'ADMINISTRATION', 'TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'APPROVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BankStatementLineStatus" AS ENUM ('UNMATCHED', 'MATCHED', 'IGNORED');

-- CreateEnum
CREATE TYPE "BankReconciliationStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateTable
CREATE TABLE "vendor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "vendor_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "contact_person" VARCHAR(120),
    "phone" VARCHAR(40),
    "email" VARCHAR(254),
    "address" VARCHAR(300),
    "tax_number" VARCHAR(60),
    "category" "VendorCategory" NOT NULL DEFAULT 'MAINTENANCE',
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "expense_number" VARCHAR(50) NOT NULL,
    "vendor_id" UUID,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'MAINTENANCE',
    "description" VARCHAR(500) NOT NULL,
    "expense_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "invoice_number" VARCHAR(100),
    "invoice_object_key" VARCHAR(500),
    "payment_method" "PaymentMethod",
    "bank_account_id" UUID,
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "rejection_reason" VARCHAR(500),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "society_bank_account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "bank_name" VARCHAR(120) NOT NULL,
    "account_title" VARCHAR(160) NOT NULL,
    "account_number_masked" VARCHAR(40) NOT NULL,
    "iban" VARCHAR(50),
    "branch_code" VARCHAR(30),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "opening_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deposit_instructions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "society_bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "financial_year" VARCHAR(20) NOT NULL,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_line" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "budget_id" UUID NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "planned_amount" DECIMAL(12,2) NOT NULL,
    "notes" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "budget_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "statement_start_date" DATE NOT NULL,
    "statement_end_date" DATE NOT NULL,
    "opening_balance" DECIMAL(14,2),
    "closing_balance" DECIMAL(14,2),
    "imported_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_line" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "statement_id" UUID NOT NULL,
    "transaction_date" DATE NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "reference" VARCHAR(120),
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(14,2),
    "status" "BankStatementLineStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matched_entity_type" VARCHAR(50),
    "matched_entity_id" UUID,
    "matched_at" TIMESTAMPTZ(6),
    "matched_by_user_id" UUID,

    CONSTRAINT "bank_statement_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_reconciliation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "reconciliation_date" DATE NOT NULL,
    "statement_balance" DECIMAL(14,2) NOT NULL,
    "ledger_balance" DECIMAL(14,2) NOT NULL,
    "difference" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "BankReconciliationStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "completed_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bank_reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_provider_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "provider_type" VARCHAR(50) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "display_name" VARCHAR(120) NOT NULL,
    "config_encrypted" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_provider_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_vendor_code_key" ON "vendor"("vendor_code");
CREATE INDEX "vendor_society_id_status_idx" ON "vendor"("society_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "expense_expense_number_key" ON "expense"("expense_number");
CREATE INDEX "expense_society_id_status_expense_date_idx" ON "expense"("society_id", "status", "expense_date");

-- CreateIndex
CREATE INDEX "society_bank_account_society_id_is_active_idx" ON "society_bank_account"("society_id", "is_active");

-- CreateIndex
CREATE INDEX "budget_society_id_financial_year_idx" ON "budget"("society_id", "financial_year");

-- CreateIndex
CREATE INDEX "budget_line_budget_id_category_idx" ON "budget_line"("budget_id", "category");

-- CreateIndex
CREATE INDEX "bank_statement_society_id_bank_account_id_idx" ON "bank_statement"("society_id", "bank_account_id");

-- CreateIndex
CREATE INDEX "bank_statement_line_statement_id_status_idx" ON "bank_statement_line"("statement_id", "status");

-- CreateIndex
CREATE INDEX "bank_reconciliation_society_id_bank_account_id_idx" ON "bank_reconciliation"("society_id", "bank_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_config_society_id_provider_type_key" ON "payment_provider_config"("society_id", "provider_type");

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense" ADD CONSTRAINT "expense_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense" ADD CONSTRAINT "expense_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "society_bank_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense" ADD CONSTRAINT "expense_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_bank_account" ADD CONSTRAINT "society_bank_account_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget" ADD CONSTRAINT "budget_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budget" ADD CONSTRAINT "budget_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line" ADD CONSTRAINT "budget_line_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement" ADD CONSTRAINT "bank_statement_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bank_statement" ADD CONSTRAINT "bank_statement_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "society_bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_line" ADD CONSTRAINT "bank_statement_line_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "bank_statement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliation" ADD CONSTRAINT "bank_reconciliation_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bank_reconciliation" ADD CONSTRAINT "bank_reconciliation_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "society_bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_provider_config" ADD CONSTRAINT "payment_provider_config_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "BankTransactionDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "BankTransactionType" AS ENUM ('OPENING_BALANCE', 'RESIDENT_PAYMENT', 'EXPENSE_PAYMENT', 'REFUND', 'ADJUSTMENT', 'OTHER');

-- CreateTable
CREATE TABLE "society_bank_transaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "society_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "direction" "BankTransactionDirection" NOT NULL,
    "type" "BankTransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "payment_id" UUID,
    "expense_id" UUID,
    "statement_line_id" UUID,
    "reference" VARCHAR(120),
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_user_id" UUID,

    CONSTRAINT "society_bank_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "society_bank_transaction_statement_line_id_key" ON "society_bank_transaction"("statement_line_id");

-- CreateIndex
CREATE INDEX "society_bank_transaction_society_id_bank_account_id_occurred_idx" ON "society_bank_transaction"("society_id", "bank_account_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "society_bank_transaction" ADD CONSTRAINT "society_bank_transaction_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_bank_transaction" ADD CONSTRAINT "society_bank_transaction_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "society_bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_bank_transaction" ADD CONSTRAINT "society_bank_transaction_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_bank_transaction" ADD CONSTRAINT "society_bank_transaction_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_bank_transaction" ADD CONSTRAINT "society_bank_transaction_statement_line_id_fkey" FOREIGN KEY ("statement_line_id") REFERENCES "bank_statement_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_bank_transaction" ADD CONSTRAINT "society_bank_transaction_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

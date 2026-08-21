-- AlterTable Society
ALTER TABLE "society" ADD COLUMN "fiscal_year_start_month" INTEGER NOT NULL DEFAULT 7;

-- AlterTable FinancialSettingPeriod
ALTER TABLE "financial_setting_period" ADD COLUMN "fiscal_year_start_month" INTEGER NOT NULL DEFAULT 7;

-- AlterTable Payment
ALTER TABLE "payment" ADD COLUMN "bank_account_id" UUID;

-- AddForeignKey Payment -> SocietyBankAccount
ALTER TABLE "payment" ADD CONSTRAINT "payment_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "society_bank_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable BankStatementLine
ALTER TABLE "bank_statement_line" ADD COLUMN "matched_bank_transaction_id" UUID;

-- CreateIndex BankStatementLine -> matchedBankTransactionId UNIQUE
CREATE UNIQUE INDEX "bank_statement_line_matched_bank_transaction_id_key" ON "bank_statement_line"("matched_bank_transaction_id");

-- AddForeignKey BankStatementLine -> SocietyBankTransaction
ALTER TABLE "bank_statement_line" ADD CONSTRAINT "bank_statement_line_matched_bank_transaction_id_fkey" FOREIGN KEY ("matched_bank_transaction_id") REFERENCES "society_bank_transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

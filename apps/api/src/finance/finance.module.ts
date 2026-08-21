import { Module } from '@nestjs/common';
import { ResidentStorageModule } from '../resident-storage/resident-storage.module';
import { DuesController } from './dues.controller';
import { FeePlansController } from './fee-plans.controller';
import { FinanceService } from './finance.service';
import { LedgerController } from './ledger.controller';
import { DevelopmentPaymentProvider } from './payment-provider';
import { ManualBankTransferProvider } from './providers/manual-bank-transfer.provider';
import { PaymentsController } from './payments.controller';
import { ReceiptService } from './receipt.service';
import { ReceiptsController } from './receipts.controller';
import { VendorsService } from './vendors/vendors.service';
import { VendorsController } from './vendors/vendors.controller';
import { ExpensesService } from './expenses/expenses.service';
import { ExpensesController } from './expenses/expenses.controller';
import { BudgetsService } from './budgets/budgets.service';
import { BudgetsController } from './budgets/budgets.controller';
import { BankingService } from './banking/banking.service';
import { BankingController } from './banking/banking.controller';
import { ReconciliationService } from './reconciliation/reconciliation.service';
import { ReconciliationController } from './reconciliation/reconciliation.controller';

@Module({
  imports: [ResidentStorageModule],
  controllers: [
    FeePlansController,
    DuesController,
    PaymentsController,
    LedgerController,
    ReceiptsController,
    VendorsController,
    ExpensesController,
    BudgetsController,
    BankingController,
    ReconciliationController,
  ],
  providers: [
    FinanceService,
    ReceiptService,
    DevelopmentPaymentProvider,
    ManualBankTransferProvider,
    VendorsService,
    ExpensesService,
    BudgetsService,
    BankingService,
    ReconciliationService,
  ],
  exports: [
    FinanceService,
    VendorsService,
    ExpensesService,
    BudgetsService,
    BankingService,
    ReconciliationService,
  ],
})
export class FinanceModule {}

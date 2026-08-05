import { Module } from '@nestjs/common';
import { ResidentStorageModule } from '../resident-storage/resident-storage.module';
import { DuesController } from './dues.controller';
import { FeePlansController } from './fee-plans.controller';
import { FinanceService } from './finance.service';
import { LedgerController } from './ledger.controller';
import { DevelopmentPaymentProvider } from './payment-provider';
import { PaymentsController } from './payments.controller';
import { ReceiptService } from './receipt.service';
import { ReceiptsController } from './receipts.controller';
@Module({
  imports: [ResidentStorageModule],
  controllers: [
    FeePlansController,
    DuesController,
    PaymentsController,
    LedgerController,
    ReceiptsController,
  ],
  providers: [FinanceService, ReceiptService, DevelopmentPaymentProvider],
  exports: [FinanceService],
})
export class FinanceModule {}

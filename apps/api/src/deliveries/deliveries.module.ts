import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { DeliveriesService } from './deliveries.service';
import { ResidentDeliveriesController } from './resident-deliveries.controller';
import { GuardDeliveriesController } from './guard-deliveries.controller';
import { AdminDeliveriesController } from './admin-deliveries.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [
    ResidentDeliveriesController,
    GuardDeliveriesController,
    AdminDeliveriesController,
  ],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}

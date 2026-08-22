import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdminInventoryController } from './admin-inventory.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AdminInventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}

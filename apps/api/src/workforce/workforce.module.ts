import { Module } from '@nestjs/common';
import { ResidentStorageModule } from '../resident-storage/resident-storage.module';
import { ResidentsModule } from '../residents/residents.module';
import { SalarySlipService } from './salary-slip.service';
import { WorkforceController } from './workforce.controller';
import { WorkforceIdService } from './workforce-id.service';
import { WorkforceService } from './workforce.service';

@Module({
  imports: [ResidentsModule, ResidentStorageModule],
  controllers: [WorkforceController],
  providers: [WorkforceService, WorkforceIdService, SalarySlipService],
  exports: [WorkforceService],
})
export class WorkforceModule {}

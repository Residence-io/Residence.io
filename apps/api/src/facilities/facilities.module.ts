import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { FacilitiesService } from './facilities.service';
import { FacilityBookingsService } from './facility-bookings.service';
import { ResidentFacilitiesController } from './resident-facilities.controller';
import { AdminFacilitiesController } from './admin-facilities.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ResidentFacilitiesController, AdminFacilitiesController],
  providers: [FacilitiesService, FacilityBookingsService],
  exports: [FacilitiesService, FacilityBookingsService],
})
export class FacilitiesModule {}

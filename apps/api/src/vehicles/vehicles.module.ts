import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { VehiclesService } from './vehicles.service';
import { ParkingService } from './parking.service';
import { ResidentVehiclesController } from './resident-vehicles.controller';
import { GuardVehiclesController } from './guard-vehicles.controller';
import { AdminVehiclesController } from './admin-vehicles.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [
    ResidentVehiclesController,
    GuardVehiclesController,
    AdminVehiclesController,
  ],
  providers: [VehiclesService, ParkingService],
  exports: [VehiclesService, ParkingService],
})
export class VehiclesModule {}

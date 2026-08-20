import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { VehiclesService } from './vehicles.service';
import { ParkingService } from './parking.service';

class IssuePermitDto {
  vehicleId: string;
  residentId: string;
  permitNumber: string;
  parkingSpaceId?: string;
  validUntil?: Date;
  notes?: string;
}

@Controller('admin')
export class AdminVehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly parkingService: ParkingService,
  ) {}

  @Get('vehicles')
  @RequirePermissions(PERMISSIONS.VEHICLE_MANAGE)
  async getAdminVehicles(@CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.getAdminVehicles(user.societyId);
  }

  @Patch('vehicles/:id/approve')
  @RequirePermissions(PERMISSIONS.VEHICLE_APPROVE)
  async approveVehicle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.approveVehicle(user.societyId, id, user.id);
  }

  @Patch('vehicles/:id/reject')
  @RequirePermissions(PERMISSIONS.VEHICLE_APPROVE) // Same role usually reviews
  async rejectVehicle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.rejectVehicle(user.societyId, id, user.id);
  }

  @Get('parking')
  @RequirePermissions(PERMISSIONS.VEHICLE_MANAGE)
  async getAdminPermits(@CurrentUser() user: AuthenticatedUser) {
    return this.parkingService.getAdminPermits(user.societyId);
  }

  @Get('parking/spaces')
  @RequirePermissions(PERMISSIONS.VEHICLE_MANAGE)
  async getAdminSpaces(@CurrentUser() user: AuthenticatedUser) {
    return this.parkingService.getAdminSpaces(user.societyId);
  }

  @Post('parking/permits')
  @RequirePermissions(PERMISSIONS.VEHICLE_MANAGE)
  async issuePermit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: IssuePermitDto,
  ) {
    return this.parkingService.issuePermit(user.societyId, user.id, body);
  }
}

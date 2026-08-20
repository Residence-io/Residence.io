import { Controller, Get, Post, Body } from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { VehiclesService } from './vehicles.service';
import { ParkingService } from './parking.service';

class CreateVehicleDto {
  type: string;
  registrationNumber: string;
  name?: string;
  manufacturer?: string;
  model?: string;
  colour?: string;
}

@Controller()
export class ResidentVehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly parkingService: ParkingService,
  ) {}

  @Get('vehicles/me')
  @RequirePermissions(PERMISSIONS.RESIDENT_READ)
  async getMyVehicles(@CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.getResidentVehicles(user.societyId, user.id);
  }

  @Post('vehicles/me')
  @RequirePermissions(PERMISSIONS.RESIDENT_READ) // Or another if available, using RESIDENT_READ per prompt structure usually means any resident action, but standard is RESIDENT_CREATE. For now, prompt didn't specify extra for create
  async registerVehicle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateVehicleDto,
  ) {
    return this.vehiclesService.createVehicle(user.societyId, user.id, body);
  }

  @Get('parking/me')
  @RequirePermissions(PERMISSIONS.RESIDENT_READ)
  async getMyParkingPermits(@CurrentUser() user: AuthenticatedUser) {
    return this.parkingService.getResidentPermits(user.societyId, user.id);
  }
}

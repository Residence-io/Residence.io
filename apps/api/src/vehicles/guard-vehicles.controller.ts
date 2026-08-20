import { Controller, Get, Param } from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { VehiclesService } from './vehicles.service';

@Controller('guard/vehicles')
export class GuardVehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('verify/:registrationNumber')
  @RequirePermissions(PERMISSIONS.VEHICLE_VERIFY)
  async verifyVehicle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('registrationNumber') registrationNumber: string,
  ) {
    return this.vehiclesService.verifyVehicle(
      user.societyId,
      registrationNumber,
    );
  }
}

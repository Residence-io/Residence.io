import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { DeliveriesService } from './deliveries.service';

class CreateParcelDto {
  residentId: string;
  courierName: string;
  trackingNumber?: string;
  description?: string;
  packageType?: string;
  unitId?: string;
  photoObjectKey?: string;
  notes?: string;
}

@Controller('guard/deliveries')
export class GuardDeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.DELIVERY_VIEW)
  async getGuardParcels(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveriesService.getGuardParcels(user.societyId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DELIVERY_CREATE)
  async createParcel(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateParcelDto,
  ) {
    return this.deliveriesService.createParcel(user.societyId, user.id, body);
  }

  @Patch(':id/collect')
  @RequirePermissions(PERMISSIONS.DELIVERY_COLLECT)
  async collectParcel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.deliveriesService.collectParcel(user.societyId, id, user.id);
  }

  @Patch(':id/return')
  @RequirePermissions(PERMISSIONS.DELIVERY_RETURN)
  async returnParcel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.deliveriesService.returnParcel(user.societyId, id, user.id);
  }
}

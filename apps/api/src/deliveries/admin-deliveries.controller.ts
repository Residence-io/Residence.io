import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { DeliveriesService } from './deliveries.service';

@Controller('admin/deliveries')
@RequirePermissions(PERMISSIONS.DELIVERY_ADMIN)
export class AdminDeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  async getAdminParcels(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveriesService.getAdminParcels(user.societyId);
  }
}

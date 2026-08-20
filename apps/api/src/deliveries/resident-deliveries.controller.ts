import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { DeliveriesService } from './deliveries.service';

@Controller('deliveries/me')
@RequirePermissions(PERMISSIONS.RESIDENT_READ)
export class ResidentDeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  async getMyDeliveries(@CurrentUser() user: AuthenticatedUser) {
    // Assuming user has a resident profile and residentId is accessible,
    // wait, how do we get residentId? Usually via a prisma query or it's attached to user?
    // Let's assume we can fetch residentId from user.id via service or we should just query it.
    // Actually, we can fetch resident profile inside the service, let's update the controller to pass userId.
    return this.deliveriesService.getResidentParcelsByUser(
      user.societyId,
      user.id,
    );
  }
}

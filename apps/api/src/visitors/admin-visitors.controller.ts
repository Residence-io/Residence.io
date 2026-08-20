import { Controller, Get, Param, Patch } from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';

import { VisitorPassService } from './visitor-pass.service';
import { VisitorStatus } from '../generated/prisma/client';

@Controller('admin/visitors')
@RequirePermissions(PERMISSIONS.VISITOR_ADMIN)
export class AdminVisitorsController {
  constructor(private readonly visitorService: VisitorPassService) {}

  @Get()
  async getVisitorPasses(@CurrentUser() user: AuthenticatedUser) {
    return this.visitorService.getAdminVisitorPasses(user.societyId);
  }

  @Patch(':id/approve')
  async approvePass(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.visitorService.setAdminStatus(
      id,
      user.societyId,
      VisitorStatus.APPROVED,
      user.id,
    );
  }

  @Patch(':id/reject')
  async rejectPass(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.visitorService.setAdminStatus(
      id,
      user.societyId,
      VisitorStatus.REJECTED,
      user.id,
    );
  }
}

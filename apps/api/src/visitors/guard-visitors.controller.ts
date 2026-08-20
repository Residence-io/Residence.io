import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';

import { VisitorPassService, CheckInDto } from './visitor-pass.service';

@Controller('guard/visitors')
@RequirePermissions(PERMISSIONS.VISITOR_VIEW)
export class GuardVisitorsController {
  constructor(private readonly visitorService: VisitorPassService) {}

  @Get('pass/:code')
  async findByPassCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: string,
  ) {
    return this.visitorService.findByPassCode(user.societyId, code);
  }

  @Get('qr/:token')
  async findByQrToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ) {
    return this.visitorService.findByQrToken(user.societyId, token);
  }

  @Get('inside')
  async getCurrentlyInside(@CurrentUser() user: AuthenticatedUser) {
    return this.visitorService.getCurrentlyInside(user.societyId);
  }

  @Post(':id/check-in')
  async checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: CheckInDto,
  ) {
    return this.visitorService.checkIn(id, user.societyId, user.id, body);
  }

  @Patch(':checkInId/check-out')
  async checkOut(
    @CurrentUser() user: AuthenticatedUser,
    @Param('checkInId') checkInId: string,
  ) {
    return this.visitorService.checkOut(checkInId, user.societyId);
  }
}

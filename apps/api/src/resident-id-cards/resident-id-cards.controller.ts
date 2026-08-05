import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  Public,
  RequirePermissions,
} from '../authorization/authorization.decorators';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { RequestUser } from '../common/request-context';
import { ResidentIDCardsService } from './resident-id-cards.service';

@ApiTags('resident ID cards')
@Controller()
export class ResidentIDCardsController {
  constructor(private readonly cards: ResidentIDCardsService) {}
  @Post('residents/:residentId/id-card')
  @RequirePermissions('RESIDENT_ID_CARD_MANAGE')
  generate(
    @CurrentUser() user: RequestUser,
    @Param('residentId', ParseUUIDPipe) residentId: string,
    @Body('reason') reason?: string,
  ) {
    return this.cards.generate(
      user,
      residentId,
      reason?.trim() || 'Initial generation',
    );
  }
  @Post('residents/:residentId/id-card/revoke')
  @RequirePermissions('RESIDENT_ID_CARD_MANAGE')
  revoke(
    @CurrentUser() user: RequestUser,
    @Param('residentId', ParseUUIDPipe) residentId: string,
    @Body('reason') reason?: string,
  ) {
    if (!reason || reason.trim().length < 3)
      throw new BadRequestException('A revocation reason is required.');
    return this.cards.revoke(user, residentId, reason.trim());
  }
  @Get('residents/:residentId/id-card')
  async download(
    @CurrentUser() user: RequestUser,
    @Param('residentId', ParseUUIDPipe) residentId: string,
    @Res() response: Response,
  ) {
    const file = await this.cards.download(user, residentId);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );
    response.send(file.buffer);
  }
  @Public() @Get('verify/card/:token') verify(@Param('token') token: string) {
    return this.cards.verify(token);
  }
}

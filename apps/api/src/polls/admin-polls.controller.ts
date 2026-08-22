import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { RequirePermissions } from '../authorization/authorization.decorators';
import { PERMISSIONS, type AuthenticatedUser } from '@residence/shared';
import { CurrentUser } from '../authorization/current-user.decorator';
import { PollsService } from './polls.service';
import { CreatePollDto, UpdatePollDto } from './dto/poll.dto';
import { PollStatus, PollType } from '../generated/prisma/client';

@Controller('admin/polls')
export class AdminPollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.POLL_VIEW)
  async listPolls(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: PollStatus,
    @Query('type') type?: PollType,
  ) {
    return this.pollsService.listPolls(user.societyId, { status, type });
  }

  @Post()
  @RequirePermissions(PERMISSIONS.POLL_CREATE)
  async createPoll(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePollDto,
  ) {
    return this.pollsService.createPoll(user.societyId, user.id, dto);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.POLL_VIEW)
  async getPoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.pollsService.getPollById(user.societyId, id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.POLL_MANAGE)
  async updatePoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePollDto,
  ) {
    return this.pollsService.updatePoll(user.societyId, id, user.id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.POLL_MANAGE)
  async publishPoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.pollsService.publishPoll(user.societyId, id, user.id);
  }

  @Post(':id/close')
  @RequirePermissions(PERMISSIONS.POLL_MANAGE)
  async closePoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.pollsService.closePoll(user.societyId, id, user.id);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.POLL_MANAGE)
  async cancelPoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.pollsService.cancelPoll(user.societyId, id, user.id);
  }

  @Get(':id/results')
  @RequirePermissions(PERMISSIONS.POLL_RESULTS)
  async getResults(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.pollsService.getPollResults(user.societyId, id);
  }
}

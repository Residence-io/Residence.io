import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { AuthenticatedUser } from '@residence/shared';
import { PollsService } from './polls.service';
import { CastVoteDto } from './dto/poll.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('resident/polls')
export class ResidentPollsController {
  constructor(
    private readonly pollsService: PollsService,
    private readonly prisma: PrismaService,
  ) {}

  private async getResident(societyId: string, userId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId, userId, status: 'ACTIVE' },
    });
    if (!resident) {
      throw new NotFoundException('Active resident profile not found.');
    }
    return resident;
  }

  @Get()
  async getMyPolls(@CurrentUser() user: AuthenticatedUser) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.pollsService.getResidentPolls(user.societyId, resident.id);
  }

  @Get(':id')
  async getPoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.pollsService.getPollById(user.societyId, id);
  }

  @Post(':id/vote')
  async castVote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CastVoteDto,
  ) {
    const resident = await this.getResident(user.societyId, user.id);
    return this.pollsService.castVote(user.societyId, id, resident.id, dto);
  }
}

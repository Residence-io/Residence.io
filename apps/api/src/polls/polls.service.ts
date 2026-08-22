import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePollDto, UpdatePollDto, CastVoteDto } from './dto/poll.dto';
import {
  PollType,
  PollStatus,
  PollEligibility,
  OccupancyType,
} from '../generated/prisma/client';

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listPolls(
    societyId: string,
    filters?: {
      status?: PollStatus;
      type?: PollType;
    },
  ) {
    return this.prisma.poll.findMany({
      where: {
        societyId,
        status: filters?.status,
        type: filters?.type,
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { ballots: true } },
        createdByUser: {
          select: { id: true, displayName: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPollById(societyId: string, id: string) {
    const poll = await this.prisma.poll.findFirst({
      where: { id, societyId },
      include: {
        options: {
          include: {
            _count: {
              select: { selections: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        createdByUser: {
          select: { id: true, displayName: true, username: true, email: true },
        },
        _count: { select: { ballots: true } },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    return poll;
  }

  async createPoll(societyId: string, userId: string, dto: CreatePollDto) {
    const opensAt = new Date(dto.opensAt);
    const closesAt = new Date(dto.closesAt);

    if (closesAt <= opensAt) {
      throw new ConflictException(
        'Poll closing date must be after opening date.',
      );
    }

    const poll = await this.prisma.poll.create({
      data: {
        societyId,
        title: dto.title,
        description: dto.description,
        type: dto.type || PollType.GENERAL,
        status: PollStatus.DRAFT,
        opensAt,
        closesAt,
        eligibility: dto.eligibility || PollEligibility.ALL_ACTIVE_RESIDENTS,
        allowMultiple: dto.allowMultiple ?? false,
        anonymous: dto.anonymous ?? true,
        createdByUserId: userId,
        options: {
          create: dto.options.map((opt, index) => ({
            label: opt.label,
            sortOrder: opt.sortOrder ?? index,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'POLL_CREATED',
      targetType: 'POLL',
      targetId: poll.id,
      outcome: 'SUCCESS',
      safeMetadata: { title: poll.title, type: poll.type },
    });

    return poll;
  }

  async updatePoll(
    societyId: string,
    id: string,
    userId: string,
    dto: UpdatePollDto,
  ) {
    const poll = await this.getPollById(societyId, id);

    if (poll.status !== PollStatus.DRAFT) {
      throw new ConflictException('Only DRAFT polls can be edited.');
    }

    const opensAt = dto.opensAt ? new Date(dto.opensAt) : poll.opensAt;
    const closesAt = dto.closesAt ? new Date(dto.closesAt) : poll.closesAt;

    if (closesAt <= opensAt) {
      throw new ConflictException('Closing date must be after opening date.');
    }

    const updated = await this.prisma.poll.update({
      where: { id: poll.id },
      data: {
        title: dto.title,
        description: dto.description,
        opensAt,
        closesAt,
        eligibility: dto.eligibility,
        allowMultiple: dto.allowMultiple,
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'POLL_UPDATED',
      targetType: 'POLL',
      targetId: updated.id,
      outcome: 'SUCCESS',
      safeMetadata: { title: updated.title },
    });

    return updated;
  }

  async publishPoll(societyId: string, id: string, userId: string) {
    const poll = await this.getPollById(societyId, id);

    if (poll.status !== PollStatus.DRAFT) {
      throw new ConflictException('Only DRAFT polls can be published.');
    }

    const now = new Date();
    const status = now >= poll.opensAt ? PollStatus.OPEN : PollStatus.SCHEDULED;

    const published = await this.prisma.poll.update({
      where: { id: poll.id },
      data: {
        status,
        publishedAt: now,
      },
      include: {
        options: true,
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'POLL_PUBLISHED',
      targetType: 'POLL',
      targetId: published.id,
      outcome: 'SUCCESS',
      safeMetadata: { status: published.status },
    });

    return published;
  }

  async closePoll(societyId: string, id: string, userId: string) {
    const poll = await this.getPollById(societyId, id);

    if (poll.status === PollStatus.CLOSED) {
      return poll;
    }

    const closed = await this.prisma.poll.update({
      where: { id: poll.id },
      data: {
        status: PollStatus.CLOSED,
        closedAt: new Date(),
      },
      include: {
        options: true,
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'POLL_CLOSED',
      targetType: 'POLL',
      targetId: closed.id,
      outcome: 'SUCCESS',
    });

    return closed;
  }

  async cancelPoll(societyId: string, id: string, userId: string) {
    const poll = await this.getPollById(societyId, id);

    const cancelled = await this.prisma.poll.update({
      where: { id: poll.id },
      data: {
        status: PollStatus.CANCELLED,
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'POLL_CANCELLED',
      targetType: 'POLL',
      targetId: cancelled.id,
      outcome: 'SUCCESS',
    });

    return cancelled;
  }

  async getPollResults(societyId: string, pollId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: { societyId, id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { selections: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { ballots: true },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const totalVotes = poll.options.reduce(
      (sum: number, opt) => sum + opt._count.selections,
      0,
    );

    const optionsWithStats = poll.options.map((opt) => {
      const count = opt._count.selections;
      const percentage =
        totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0;
      return {
        id: opt.id,
        label: opt.label,
        voteCount: count,
        percentage,
      };
    });

    return {
      pollId: poll.id,
      title: poll.title,
      type: poll.type,
      status: poll.status,
      totalBallots: poll._count.ballots,
      totalVotes,
      options: optionsWithStats,
    };
  }

  async getResidentPolls(societyId: string, residentId: string) {
    const polls = await this.prisma.poll.findMany({
      where: {
        societyId,
        status: { in: [PollStatus.OPEN, PollStatus.CLOSED] },
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        ballots: {
          where: { residentId },
          include: { selections: { select: { optionId: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return polls.map((p) => {
      const residentBallot = p.ballots[0];
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        status: p.status,
        opensAt: p.opensAt,
        closesAt: p.closesAt,
        eligibility: p.eligibility,
        allowMultiple: p.allowMultiple,
        anonymous: p.anonymous,
        options: p.options,
        hasVoted: Boolean(residentBallot),
        votedOptionIds: residentBallot
          ? residentBallot.selections.map((s) => s.optionId)
          : [],
      };
    });
  }

  async castVote(
    societyId: string,
    pollId: string,
    residentId: string,
    dto: CastVoteDto,
  ) {
    const poll = await this.prisma.poll.findFirst({
      where: { id: pollId, societyId },
      include: { options: true },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const now = new Date();
    if (
      poll.status !== PollStatus.OPEN ||
      now < poll.opensAt ||
      now > poll.closesAt
    ) {
      throw new ConflictException('Voting is not active for this poll.');
    }

    // Determine target options
    const selectedOptionIds: string[] = [];
    if (dto.optionId) {
      selectedOptionIds.push(dto.optionId);
    }
    if (dto.optionIds && Array.isArray(dto.optionIds)) {
      for (const optId of dto.optionIds) {
        if (!selectedOptionIds.includes(optId)) {
          selectedOptionIds.push(optId);
        }
      }
    }

    if (selectedOptionIds.length === 0) {
      throw new ConflictException('At least one poll option must be selected.');
    }

    if (!poll.allowMultiple && selectedOptionIds.length > 1) {
      throw new ConflictException(
        'Single-choice polls only allow one option selection.',
      );
    }

    // Validate that all options belong to this poll
    const validOptionIdSet = new Set(poll.options.map((o) => o.id));
    for (const optId of selectedOptionIds) {
      if (!validOptionIdSet.has(optId)) {
        throw new ConflictException(`Invalid poll option selected: ${optId}`);
      }
    }

    await this.verifyResidentEligibility(
      societyId,
      residentId,
      poll.eligibility,
    );

    // Fast-fail check: verify if ballot already exists
    const existingBallot = await this.prisma.pollBallot.findUnique({
      where: {
        uk_poll_ballot_poll_resident: {
          pollId: poll.id,
          residentId,
        },
      },
    });

    if (existingBallot) {
      throw new ConflictException(
        'You have already cast a ballot for this poll.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const ballot = await tx.pollBallot.create({
        data: {
          societyId,
          pollId: poll.id,
          residentId,
          selections: {
            create: selectedOptionIds.map((optId) => ({
              optionId: optId,
            })),
          },
        },
      });

      await this.auditService.recordSafely({
        societyId,
        action: 'VOTE_CAST',
        targetType: 'POLL',
        targetId: poll.id,
        outcome: 'SUCCESS',
        safeMetadata: {
          pollId: poll.id,
          anonymous: poll.anonymous,
        },
      });

      return {
        success: true,
        message: 'Vote recorded successfully',
        ballotId: ballot.id,
      };
    });
  }

  private async verifyResidentEligibility(
    societyId: string,
    residentId: string,
    eligibility: PollEligibility,
  ) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, societyId, status: 'ACTIVE' },
      include: {
        occupancies: {
          where: {
            OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
          },
        },
      },
    });

    if (!resident || resident.occupancies.length === 0) {
      throw new ForbiddenException(
        'Only active residents with valid occupancy can vote.',
      );
    }

    if (eligibility === PollEligibility.ALL_ACTIVE_RESIDENTS) {
      const allowedTypes: OccupancyType[] = [
        OccupancyType.OWNER,
        OccupancyType.TENANT,
      ];
      const hasEligibleOccupancy = resident.occupancies.some((occ) =>
        allowedTypes.includes(occ.occupancyType),
      );
      if (!hasEligibleOccupancy) {
        throw new ForbiddenException(
          'Resident does not meet general eligibility criteria.',
        );
      }
      return true;
    }

    if (eligibility === PollEligibility.OWNERS_ONLY) {
      const isOwner = resident.occupancies.some(
        (occ) => occ.occupancyType === OccupancyType.OWNER,
      );
      if (!isOwner) {
        throw new ForbiddenException(
          'This poll is restricted to property owners only.',
        );
      }
      return true;
    }

    if (eligibility === PollEligibility.TENANTS_ONLY) {
      const isTenant = resident.occupancies.some(
        (occ) => occ.occupancyType === OccupancyType.TENANT,
      );
      if (!isTenant) {
        throw new ForbiddenException(
          'This poll is restricted to tenants only.',
        );
      }
      return true;
    }

    return true;
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { PollsService } from './polls.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  PollType,
  PollStatus,
  PollEligibility,
  OccupancyType,
} from '../generated/prisma/client';

describe('PollsService', () => {
  let service: PollsService;
  let prisma: any;
  let audit: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';
  const mockResidentId = '33333333-3333-3333-3333-333333333333';

  const mockPoll = {
    id: 'poll-1',
    societyId: mockSocietyId,
    title: 'Community Garden Upgrade',
    type: PollType.GENERAL,
    status: PollStatus.OPEN,
    opensAt: new Date(Date.now() - 3600000),
    closesAt: new Date(Date.now() + 86400000),
    eligibility: PollEligibility.ALL_ACTIVE_RESIDENTS,
    allowMultiple: false,
    anonymous: true,
    options: [
      { id: 'opt-1', label: 'Option A: Flower Garden', sortOrder: 0 },
      { id: 'opt-2', label: 'Option B: Play Area', sortOrder: 1 },
    ],
  };

  const mockResident = {
    id: mockResidentId,
    societyId: mockSocietyId,
    status: 'ACTIVE',
    occupancies: [
      {
        occupancyType: OccupancyType.OWNER,
        endDate: null,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      poll: {
        findMany: jest.fn().mockResolvedValue([mockPoll]),
        findFirst: jest.fn().mockResolvedValue(mockPoll),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'new-poll-id', ...data }),
          ),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ ...mockPoll, ...data }),
          ),
      },
      resident: {
        findFirst: jest.fn().mockResolvedValue(mockResident),
      },
      pollBallot: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'ballot-1' }),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    audit = {
      recordSafely: jest.fn().mockResolvedValue(undefined),
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<PollsService>(PollsService);
  });

  it('should list polls under society isolation', async () => {
    const result = await service.listPolls(mockSocietyId);
    expect(prisma.poll.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ societyId: mockSocietyId }),
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Community Garden Upgrade');
  });

  it('should create poll with options in draft status', async () => {
    const result = await service.createPoll(mockSocietyId, mockUserId, {
      title: 'Community Garden Upgrade',
      type: PollType.GENERAL,
      opensAt: new Date().toISOString(),
      closesAt: new Date(Date.now() + 86400000).toISOString(),
      options: [
        { label: 'Option A', sortOrder: 0 },
        { label: 'Option B', sortOrder: 1 },
      ],
    });

    expect(prisma.poll.create).toHaveBeenCalled();
    expect(result.title).toBe('Community Garden Upgrade');
    expect(result.status).toBe(PollStatus.DRAFT);
    expect(audit.recordSafely).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'POLL_CREATED' }),
    );
  });

  it('should allow eligible resident to cast vote and record anonymous audit event without leaking optionId', async () => {
    const result = await service.castVote(
      mockSocietyId,
      'poll-1',
      mockResidentId,
      {
        optionId: 'opt-1',
      },
    );

    expect(prisma.pollBallot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pollId: 'poll-1',
          residentId: mockResidentId,
        }),
      }),
    );

    expect(audit.recordSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'VOTE_CAST',
        safeMetadata: expect.not.objectContaining({ optionId: 'opt-1' }),
      }),
    );

    expect(result.success).toBe(true);
  });

  it('should reject duplicate vote under single-choice poll', async () => {
    prisma.pollBallot.findUnique.mockResolvedValue({
      id: 'ballot-existing',
      pollId: 'poll-1',
      residentId: mockResidentId,
    });

    await expect(
      service.castVote(mockSocietyId, 'poll-1', mockResidentId, {
        optionId: 'opt-1',
      }),
    ).rejects.toThrow('already cast a ballot');
  });

  it('should reject vote if resident is not eligible (OWNERS_ONLY poll vs TENANT resident)', async () => {
    prisma.poll.findFirst.mockResolvedValue({
      ...mockPoll,
      eligibility: PollEligibility.OWNERS_ONLY,
    });

    prisma.resident.findFirst.mockResolvedValue({
      ...mockResident,
      occupancies: [{ occupancyType: OccupancyType.TENANT, endDate: null }],
    });

    await expect(
      service.castVote(mockSocietyId, 'poll-1', mockResidentId, {
        optionId: 'opt-1',
      }),
    ).rejects.toThrow('restricted to property owners');
  });
});

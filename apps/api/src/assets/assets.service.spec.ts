import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  AssetStatus,
  AssetCondition,
  AssetCategory,
  Prisma,
} from '../generated/prisma/client';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: any;
  let audit: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';

  const mockAsset = {
    id: 'asset-1',
    societyId: mockSocietyId,
    assetCode: 'AST-2026-ABCD1234',
    name: 'Backup Generator 100kVA',
    category: AssetCategory.GENERATOR,
    status: AssetStatus.ACTIVE,
    condition: AssetCondition.EXCELLENT,
    purchaseCost: new Prisma.Decimal(1500000),
    currency: 'PKR',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 0,
  };

  beforeEach(async () => {
    prisma = {
      asset: {
        findMany: jest.fn().mockResolvedValue([mockAsset]),
        findFirst: jest.fn().mockResolvedValue(mockAsset),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'new-id', ...data }),
          ),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ ...mockAsset, ...data }),
          ),
      },
      assetStatusHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
      },
      assetDocument: {
        create: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    audit = {
      recordSafely: jest.fn().mockResolvedValue(undefined),
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  it('should list assets enforcing society isolation', async () => {
    const result = await service.listAssets(mockSocietyId, {
      status: AssetStatus.ACTIVE,
    });

    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          societyId: mockSocietyId,
          status: AssetStatus.ACTIVE,
        }),
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Backup Generator 100kVA');
  });

  it('should create an asset with generated unique code and audit event', async () => {
    const result = await service.createAsset(mockSocietyId, mockUserId, {
      name: 'Water Booster Pump',
      category: AssetCategory.PUMP,
      purchaseCost: 85000,
    });

    expect(prisma.asset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          societyId: mockSocietyId,
          name: 'Water Booster Pump',
          category: AssetCategory.PUMP,
          status: AssetStatus.ACTIVE,
        }),
      }),
    );

    expect(audit.recordSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        societyId: mockSocietyId,
        actorUserId: mockUserId,
        action: 'ASSET_CREATED',
      }),
    );

    expect(result.id).toBe('new-id');
  });

  it('should update asset and record audit event', async () => {
    const result = await service.updateAsset(
      mockSocietyId,
      'asset-1',
      mockUserId,
      {
        name: 'Updated Generator Name',
      },
    );

    expect(result.name).toBe('Updated Generator Name');
    expect(audit.recordSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        societyId: mockSocietyId,
        actorUserId: mockUserId,
        action: 'ASSET_UPDATED',
      }),
    );
  });

  it('should update asset status and record status history', async () => {
    const result = await service.updateAssetStatus(
      mockSocietyId,
      'asset-1',
      mockUserId,
      {
        status: AssetStatus.IN_MAINTENANCE,
        reason: 'Scheduled major overhaul',
      },
    );

    expect(result.status).toBe(AssetStatus.IN_MAINTENANCE);
    expect(prisma.assetStatusHistory.create).toHaveBeenCalled();
    expect(audit.recordSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ASSET_STATUS_CHANGED',
      }),
    );
  });
});

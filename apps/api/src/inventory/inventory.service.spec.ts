import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventoryMovementType, Prisma } from '../generated/prisma/client';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: any;
  let audit: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';

  const mockItem = {
    id: 'item-1',
    societyId: mockSocietyId,
    sku: 'ELEC-LED-18W',
    name: '18W LED Ceiling Light',
    category: 'Electrical',
    unitOfMeasure: 'pcs',
    currentQuantity: new Prisma.Decimal(50),
    minimumQuantity: new Prisma.Decimal(10),
    reorderLevel: new Prisma.Decimal(20),
    unitCost: new Prisma.Decimal(650),
    currency: 'PKR',
    active: true,
  };

  beforeEach(async () => {
    prisma = {
      inventoryItem: {
        findMany: jest.fn().mockResolvedValue([mockItem]),
        findFirst: jest.fn().mockResolvedValue(mockItem),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'new-item-id', ...data }),
          ),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ ...mockItem, ...data }),
          ),
      },
      inventoryMovement: {
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'mov-1', ...data }),
          ),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    audit = {
      recordSafely: jest.fn().mockResolvedValue(undefined),
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should list inventory items with society isolation', async () => {
    const result = await service.listItems(mockSocietyId);
    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ societyId: mockSocietyId }),
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].sku).toBe('ELEC-LED-18W');
  });

  it('should record stock addition and update current quantity atomically', async () => {
    const result = await service.recordMovement(
      mockSocietyId,
      'item-1',
      mockUserId,
      {
        type: InventoryMovementType.RECEIPT,
        quantity: 25,
        unitCost: 650,
      },
    );

    expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          societyId: mockSocietyId,
          inventoryItemId: 'item-1',
          type: InventoryMovementType.RECEIPT,
        }),
      }),
    );

    expect(audit.recordSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'INVENTORY_MOVEMENT_RECORDED',
      }),
    );

    expect(result.item.currentQuantity).toEqual(new Prisma.Decimal(75));
  });

  it('should prevent issue when quantity exceeds available stock (strict negative balance prevention)', async () => {
    await expect(
      service.recordMovement(mockSocietyId, 'item-1', mockUserId, {
        type: InventoryMovementType.ISSUE,
        quantity: 100, // available is 50
      }),
    ).rejects.toThrow('Insufficient stock');
  });

  it('should reconstruct stock accurately from immutable movement ledger', async () => {
    prisma.inventoryMovement.findMany.mockResolvedValue([
      {
        type: InventoryMovementType.OPENING_BALANCE,
        quantity: new Prisma.Decimal(100),
      },
      { type: InventoryMovementType.RECEIPT, quantity: new Prisma.Decimal(50) },
      { type: InventoryMovementType.ISSUE, quantity: new Prisma.Decimal(30) },
      {
        type: InventoryMovementType.ADJUSTMENT_OUT,
        quantity: new Prisma.Decimal(5),
      },
      { type: InventoryMovementType.RETURN, quantity: new Prisma.Decimal(2) },
    ]);

    const balance = await service.reconstructStock(mockSocietyId, 'item-1');
    expect(balance).toEqual(new Prisma.Decimal(117)); // 100 + 50 - 30 - 5 + 2 = 117
  });
});

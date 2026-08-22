import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  RecordMovementDto,
} from './dto/inventory.dto';
import { Prisma } from '../generated/prisma/client';

const INFLOW_TYPES: readonly string[] = [
  'OPENING_BALANCE',
  'RECEIPT',
  'ADJUSTMENT_IN',
  'RETURN',
];

const OUTFLOW_TYPES: readonly string[] = ['ISSUE', 'ADJUSTMENT_OUT'];

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listItems(
    societyId: string,
    filters?: {
      category?: string;
      lowStockOnly?: boolean;
      search?: string;
    },
  ) {
    const where: Prisma.InventoryItemWhereInput = { societyId };

    if (filters?.category) where.category = filters.category;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        defaultVendor: { select: { id: true, name: true } },
        _count: { select: { movements: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (filters?.lowStockOnly) {
      return items.filter((item) =>
        item.currentQuantity.lte(item.reorderLevel),
      );
    }

    return items;
  }

  async getItemById(societyId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, societyId },
      include: {
        defaultVendor: true,
        movements: {
          include: {
            createdByUser: {
              select: {
                id: true,
                displayName: true,
                username: true,
                email: true,
              },
            },
            maintenanceRequest: {
              select: { id: true, ticketNumber: true, subject: true },
            },
            vendor: { select: { id: true, name: true } },
          },
          orderBy: { occurredAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  async createItem(
    societyId: string,
    userId: string,
    dto: CreateInventoryItemDto,
  ) {
    const existing = await this.prisma.inventoryItem.findUnique({
      where: {
        uk_inventory_item_society_sku: {
          societyId,
          sku: dto.sku,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Item with SKU "${dto.sku}" already exists.`);
    }

    const item = await this.prisma.inventoryItem.create({
      data: {
        societyId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unitOfMeasure: dto.unitOfMeasure,
        currentQuantity: new Prisma.Decimal(0),
        reorderLevel: new Prisma.Decimal(dto.reorderLevel ?? 0),
        minimumQuantity: new Prisma.Decimal(dto.minimumQuantity ?? 0),
        unitCost: new Prisma.Decimal(dto.unitCost ?? 0),
        currency: dto.currency || 'PKR',
        defaultVendorId: dto.defaultVendorId,
        notes: dto.notes,
        active: true,
      },
      include: {
        defaultVendor: true,
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'INVENTORY_ITEM_CREATED',
      targetType: 'INVENTORY_ITEM',
      targetId: item.id,
      outcome: 'SUCCESS',
      safeMetadata: { sku: item.sku, name: item.name },
    });

    return item;
  }

  async updateItem(
    societyId: string,
    id: string,
    userId: string,
    dto: UpdateInventoryItemDto,
  ) {
    const item = await this.getItemById(societyId, id);

    const updated = await this.prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unitOfMeasure: dto.unitOfMeasure,
        reorderLevel:
          dto.reorderLevel !== undefined
            ? new Prisma.Decimal(dto.reorderLevel)
            : undefined,
        minimumQuantity:
          dto.minimumQuantity !== undefined
            ? new Prisma.Decimal(dto.minimumQuantity)
            : undefined,
        unitCost:
          dto.unitCost !== undefined
            ? new Prisma.Decimal(dto.unitCost)
            : undefined,
        currency: dto.currency,
        defaultVendorId: dto.defaultVendorId,
        notes: dto.notes,
        active: dto.active,
      },
      include: {
        defaultVendor: true,
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'INVENTORY_ITEM_UPDATED',
      targetType: 'INVENTORY_ITEM',
      targetId: updated.id,
      outcome: 'SUCCESS',
      safeMetadata: { sku: updated.sku },
    });

    return updated;
  }

  async recordMovement(
    societyId: string,
    itemId: string,
    userId: string,
    dto: RecordMovementDto,
  ) {
    const quantityDelta = new Prisma.Decimal(dto.quantity);
    if (quantityDelta.lte(0)) {
      throw new ConflictException(
        'Movement quantity must be strictly positive.',
      );
    }

    const isAddition = INFLOW_TYPES.includes(dto.type);
    const isSubtraction = OUTFLOW_TYPES.includes(dto.type);

    if (!isAddition && !isSubtraction) {
      throw new ConflictException(`Invalid movement type: ${dto.type}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { id: itemId, societyId },
      });

      if (!item) {
        throw new NotFoundException('Inventory item not found');
      }

      if (isSubtraction && item.currentQuantity.lt(quantityDelta)) {
        throw new ConflictException(
          `Insufficient stock for item "${item.name}". Current: ${item.currentQuantity.toString()}, Requested: ${quantityDelta.toString()}`,
        );
      }

      const nextQuantity = isAddition
        ? item.currentQuantity.add(quantityDelta)
        : item.currentQuantity.sub(quantityDelta);

      const movement = await tx.inventoryMovement.create({
        data: {
          societyId,
          inventoryItemId: item.id,
          type: dto.type,
          quantity: quantityDelta,
          unitCost:
            dto.unitCost !== undefined
              ? new Prisma.Decimal(dto.unitCost)
              : item.unitCost,
          reference: dto.reference,
          maintenanceRequestId: dto.maintenanceRequestId,
          vendorId: dto.vendorId,
          occurredAt: new Date(),
          notes: dto.notes,
          createdByUserId: userId,
        },
      });

      const updatedItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          currentQuantity: nextQuantity,
          unitCost:
            dto.unitCost !== undefined
              ? new Prisma.Decimal(dto.unitCost)
              : undefined,
        },
      });

      await this.auditService.recordSafely({
        societyId,
        actorUserId: userId,
        action: 'INVENTORY_MOVEMENT_RECORDED',
        targetType: 'INVENTORY_MOVEMENT',
        targetId: movement.id,
        outcome: 'SUCCESS',
        safeMetadata: {
          sku: item.sku,
          type: dto.type,
          quantity: quantityDelta.toString(),
          balanceAfter: nextQuantity.toString(),
        },
      });

      return {
        movement,
        item: updatedItem,
      };
    });
  }

  async reconstructStock(
    societyId: string,
    itemId: string,
  ): Promise<Prisma.Decimal> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { societyId, inventoryItemId: itemId },
      orderBy: { occurredAt: 'asc' },
    });

    let balance = new Prisma.Decimal(0);
    for (const m of movements) {
      if (INFLOW_TYPES.includes(m.type)) {
        balance = balance.add(m.quantity);
      } else if (OUTFLOW_TYPES.includes(m.type)) {
        balance = balance.sub(m.quantity);
      }
    }

    return balance;
  }
}

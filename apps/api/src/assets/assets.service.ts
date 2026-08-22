import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateAssetDto,
  UpdateAssetDto,
  UpdateAssetStatusDto,
  AttachAssetDocumentDto,
} from './dto/asset.dto';
import {
  AssetStatus,
  AssetCondition,
  AssetCategory,
  Prisma,
} from '../generated/prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async generateAssetCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'AST';
    for (let attempts = 0; attempts < 5; attempts++) {
      const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
      const code = `${prefix}-${year}-${rand}`;
      const existing = await this.prisma.asset.findUnique({
        where: { assetCode: code },
      });
      if (!existing) {
        return code;
      }
    }
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${year}-${timestamp}`;
  }

  async listAssets(
    societyId: string,
    filters?: {
      status?: AssetStatus;
      category?: AssetCategory;
      facilityId?: string;
      search?: string;
    },
  ) {
    const where: Prisma.AssetWhereInput = { societyId };

    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { assetCode: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.asset.findMany({
      where,
      include: {
        facility: { select: { id: true, name: true, category: true } },
        vendor: { select: { id: true, name: true, category: true } },
        assignedWorker: {
          select: {
            id: true,
            fullName: true,
            workerNumber: true,
            primaryPhone: true,
          },
        },
        _count: {
          select: { maintenanceRequests: true, documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssetById(societyId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, societyId },
      include: {
        facility: true,
        vendor: true,
        assignedWorker: true,
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          include: {
            actedByUser: {
              select: {
                id: true,
                displayName: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        maintenanceRequests: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async createAsset(societyId: string, userId: string, dto: CreateAssetDto) {
    const assetCode = await this.generateAssetCode();

    const asset = await this.prisma.asset.create({
      data: {
        societyId,
        assetCode,
        name: dto.name,
        category: dto.category,
        status: AssetStatus.ACTIVE,
        condition: dto.condition || AssetCondition.GOOD,
        location: dto.location,
        manufacturer: dto.manufacturer,
        model: dto.model,
        serialNumber: dto.serialNumber,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        purchaseCost:
          dto.purchaseCost !== undefined
            ? new Prisma.Decimal(dto.purchaseCost)
            : undefined,
        currency: dto.currency || 'PKR',
        warrantyExpiry: dto.warrantyExpiry
          ? new Date(dto.warrantyExpiry)
          : undefined,
        facilityId: dto.facilityId,
        vendorId: dto.vendorId,
        assignedWorkerId: dto.assignedWorkerId,
        notes: dto.notes,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: AssetStatus.ACTIVE,
            reason: 'Initial asset registration',
            actedByUserId: userId,
          },
        },
      },
      include: {
        facility: true,
        vendor: true,
        assignedWorker: true,
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'ASSET_CREATED',
      targetType: 'ASSET',
      targetId: asset.id,
      outcome: 'SUCCESS',
      safeMetadata: { assetCode: asset.assetCode, name: asset.name },
    });

    return asset;
  }

  async updateAsset(
    societyId: string,
    id: string,
    userId: string,
    dto: UpdateAssetDto,
  ) {
    const existing = await this.getAssetById(societyId, id);

    const asset = await this.prisma.asset.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        category: dto.category,
        condition: dto.condition,
        location: dto.location,
        manufacturer: dto.manufacturer,
        model: dto.model,
        serialNumber: dto.serialNumber,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        purchaseCost:
          dto.purchaseCost !== undefined
            ? new Prisma.Decimal(dto.purchaseCost)
            : undefined,
        currency: dto.currency,
        warrantyExpiry: dto.warrantyExpiry
          ? new Date(dto.warrantyExpiry)
          : undefined,
        facilityId: dto.facilityId,
        vendorId: dto.vendorId,
        assignedWorkerId: dto.assignedWorkerId,
        notes: dto.notes,
      },
      include: {
        facility: true,
        vendor: true,
        assignedWorker: true,
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'ASSET_UPDATED',
      targetType: 'ASSET',
      targetId: asset.id,
      outcome: 'SUCCESS',
      safeMetadata: { assetCode: asset.assetCode },
    });

    return asset;
  }

  async updateAssetStatus(
    societyId: string,
    id: string,
    userId: string,
    dto: UpdateAssetStatusDto,
  ) {
    return this.updateStatus(societyId, id, userId, dto);
  }

  async updateStatus(
    societyId: string,
    id: string,
    userId: string,
    dto: UpdateAssetStatusDto,
  ) {
    const asset = await this.getAssetById(societyId, id);

    if (asset.status === dto.status) {
      return asset;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.assetStatusHistory.create({
        data: {
          assetId: asset.id,
          fromStatus: asset.status,
          toStatus: dto.status,
          reason: dto.reason,
          actedByUserId: userId,
        },
      });

      return tx.asset.update({
        where: { id: asset.id },
        data: { status: dto.status },
        include: {
          facility: true,
          vendor: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'ASSET_STATUS_CHANGED',
      targetType: 'ASSET',
      targetId: asset.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        assetCode: asset.assetCode,
        fromStatus: asset.status,
        toStatus: dto.status,
        reason: dto.reason,
      },
    });

    return updated;
  }

  async attachDocument(
    societyId: string,
    id: string,
    userId: string,
    dto: AttachAssetDocumentDto,
  ) {
    const asset = await this.getAssetById(societyId, id);

    const doc = await this.prisma.assetDocument.create({
      data: {
        assetId: asset.id,
        objectKey: dto.objectKey,
        originalName: dto.originalName,
        mediaType: dto.mediaType,
        sizeBytes: BigInt(dto.sizeBytes),
        checksumSha256: dto.checksumSha256,
        category: dto.category,
        uploadedByUserId: userId,
      },
    });

    await this.auditService.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'ASSET_DOCUMENT_ATTACHED',
      targetType: 'ASSET_DOCUMENT',
      targetId: doc.id,
      outcome: 'SUCCESS',
      safeMetadata: { assetId: asset.id, originalName: doc.originalName },
    });

    return doc;
  }
}

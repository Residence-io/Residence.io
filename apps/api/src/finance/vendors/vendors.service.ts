import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateVendorDto, UpdateVendorDto } from '../dto/finance-expansion.dto';
import { VendorStatus } from '../../generated/prisma/client';
import { randomBytes } from 'node:crypto';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private generateVendorCode(): string {
    const year = new Date().getFullYear();
    const rand = randomBytes(5).toString('hex').toUpperCase();
    return `VEN-${year}-${rand}`;
  }

  async listVendors(societyId: string, status?: VendorStatus) {
    return this.prisma.vendor.findMany({
      where: {
        societyId,
        ...(status ? { status } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async getVendorById(societyId: string, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, societyId },
      include: {
        expenses: {
          orderBy: { expenseDate: 'desc' },
          take: 20,
        },
      },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found in this society.');
    }
    return vendor;
  }

  async createVendor(societyId: string, userId: string, dto: CreateVendorDto) {
    let attempts = 0;
    const maxAttempts = 3;
    let vendor: any = null;

    while (attempts < maxAttempts) {
      try {
        const vendorCode = this.generateVendorCode();
        vendor = await this.prisma.vendor.create({
          data: {
            societyId,
            vendorCode,
            name: dto.name,
            contactPerson: dto.contactPerson || null,
            phone: dto.phone || null,
            email: dto.email || null,
            address: dto.address || null,
            taxNumber: dto.taxNumber || null,
            category: dto.category || 'MAINTENANCE',
            notes: dto.notes || null,
            status: VendorStatus.ACTIVE,
          },
        });
        break;
      } catch (err: any) {
        if (
          err?.code === 'P2002' &&
          (err?.meta?.target?.includes('vendor_code') ||
            err?.meta?.target?.includes('vendorCode'))
        ) {
          attempts++;
          if (attempts >= maxAttempts) throw err;
          continue;
        }
        throw err;
      }
    }

    if (!vendor) {
      throw new BadRequestException(
        'Could not generate unique vendor code. Please try again.',
      );
    }

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'VENDOR_CREATED',
      targetType: 'Vendor',
      targetId: vendor.id,
      outcome: 'SUCCESS',
      safeMetadata: { vendorCode: vendor.vendorCode, name: vendor.name },
    });

    return vendor;
  }

  async updateVendor(
    societyId: string,
    id: string,
    userId: string,
    dto: UpdateVendorDto,
  ) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, societyId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found.');
    }

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.contactPerson !== undefined
          ? { contactPerson: dto.contactPerson }
          : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.taxNumber !== undefined ? { taxNumber: dto.taxNumber } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action:
        dto.status && dto.status !== vendor.status
          ? 'VENDOR_STATUS_CHANGED'
          : 'VENDOR_UPDATED',
      targetType: 'Vendor',
      targetId: vendor.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        vendorCode: vendor.vendorCode,
        name: updated.name,
        status: updated.status,
      },
    });

    return updated;
  }
}

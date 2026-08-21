import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FacilityStatus, AuditOutcome } from '../generated/prisma/client';
import {
  CreateFacilityDto,
  UpdateFacilityDto,
  CreateBlockoutDto,
} from './dto/facility.dto';

@Injectable()
export class FacilitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getSocietyFacilities(societyId: string, status?: FacilityStatus) {
    return this.prisma.facility.findMany({
      where: {
        societyId,
        ...(status ? { status } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async getFacilityById(societyId: string, id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        blockouts: {
          where: {
            endsAt: { gte: new Date() },
          },
          orderBy: { startsAt: 'asc' },
        },
      },
    });

    if (!facility || facility.societyId !== societyId) {
      throw new NotFoundException('Facility not found.');
    }

    return facility;
  }

  async createFacility(
    societyId: string,
    actorUserId: string,
    dto: CreateFacilityDto,
  ) {
    const facility = await this.prisma.facility.create({
      data: {
        societyId,
        name: dto.name,
        description: dto.description,
        location: dto.location,
        category: dto.category,
        capacity: dto.capacity,
        status: dto.status ?? FacilityStatus.ACTIVE,
        openingTime: dto.openingTime ?? '08:00',
        closingTime: dto.closingTime ?? '22:00',
        bookingDurationMinutes: dto.bookingDurationMinutes ?? 60,
        advanceBookingDays: dto.advanceBookingDays ?? 7,
        bookingFee: dto.bookingFee ?? 0,
        depositAmount: dto.depositAmount ?? 0,
        currency: dto.currency ?? 'PKR',
        requiresApproval: dto.requiresApproval ?? false,
        rules: dto.rules,
        cancellationPolicy: dto.cancellationPolicy,
        imageObjectKey: dto.imageObjectKey,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId,
      action: 'FACILITY_CREATED',
      targetType: 'Facility',
      targetId: facility.id,
      outcome: AuditOutcome.SUCCESS,
      safeMetadata: {
        id: facility.id,
        name: facility.name,
        status: facility.status,
      },
    });

    return facility;
  }

  async updateFacility(
    societyId: string,
    id: string,
    actorUserId: string,
    dto: UpdateFacilityDto,
  ) {
    const existing = await this.getFacilityById(societyId, id);

    const facility = await this.prisma.facility.update({
      where: { id: existing.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.openingTime !== undefined
          ? { openingTime: dto.openingTime }
          : {}),
        ...(dto.closingTime !== undefined
          ? { closingTime: dto.closingTime }
          : {}),
        ...(dto.bookingDurationMinutes !== undefined
          ? { bookingDurationMinutes: dto.bookingDurationMinutes }
          : {}),
        ...(dto.advanceBookingDays !== undefined
          ? { advanceBookingDays: dto.advanceBookingDays }
          : {}),
        ...(dto.bookingFee !== undefined ? { bookingFee: dto.bookingFee } : {}),
        ...(dto.depositAmount !== undefined
          ? { depositAmount: dto.depositAmount }
          : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.requiresApproval !== undefined
          ? { requiresApproval: dto.requiresApproval }
          : {}),
        ...(dto.rules !== undefined ? { rules: dto.rules } : {}),
        ...(dto.cancellationPolicy !== undefined
          ? { cancellationPolicy: dto.cancellationPolicy }
          : {}),
        ...(dto.imageObjectKey !== undefined
          ? { imageObjectKey: dto.imageObjectKey }
          : {}),
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId,
      action:
        dto.status && dto.status !== existing.status
          ? 'FACILITY_STATUS_CHANGED'
          : 'FACILITY_UPDATED',
      targetType: 'Facility',
      targetId: facility.id,
      outcome: AuditOutcome.SUCCESS,

      safeMetadata: { status: facility.status },
    });

    return facility;
  }

  async createBlockout(
    societyId: string,
    facilityId: string,
    actorUserId: string,
    dto: CreateBlockoutDto,
  ) {
    const facility = await this.getFacilityById(societyId, facilityId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (
      isNaN(startsAt.getTime()) ||
      isNaN(endsAt.getTime()) ||
      startsAt >= endsAt
    ) {
      throw new BadRequestException('Invalid start or end time for blockout.');
    }

    const blockout = await this.prisma.facilityBlockout.create({
      data: {
        societyId,
        facilityId: facility.id,
        startsAt,
        endsAt,
        reason: dto.reason,
        createdByUserId: actorUserId,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId,
      action: 'FACILITY_BLOCKED',
      targetType: 'FacilityBlockout',
      targetId: blockout.id,
      outcome: AuditOutcome.SUCCESS,
      safeMetadata: { facilityId, startsAt, endsAt, reason: dto.reason },
    });

    return blockout;
  }

  async deleteBlockout(
    societyId: string,
    facilityId: string,
    blockoutId: string,
    actorUserId: string,
  ) {
    const blockout = await this.prisma.facilityBlockout.findUnique({
      where: { id: blockoutId },
    });

    if (
      !blockout ||
      blockout.societyId !== societyId ||
      blockout.facilityId !== facilityId
    ) {
      throw new NotFoundException('Blockout record not found.');
    }

    await this.prisma.facilityBlockout.delete({
      where: { id: blockoutId },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId,
      action: 'FACILITY_UNBLOCKED',
      targetType: 'FacilityBlockout',
      targetId: blockoutId,
      outcome: AuditOutcome.SUCCESS,
    });

    return { success: true };
  }
}

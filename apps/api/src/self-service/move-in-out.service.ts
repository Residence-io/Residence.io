import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FinanceService } from '../finance/finance.service';
import {
  CreateMoveInRequestDto,
  ReviewMoveInRequestDto,
  CreateMoveOutRequestDto,
  ReviewMoveOutRequestDto,
  UpdateMoveOutClearanceDto,
} from './dto/self-service.dto';
import {
  MoveInRequestStatus,
  MoveOutRequestStatus,
  Prisma,
} from '../generated/prisma/client';
import { randomBytes } from 'node:crypto';

@Injectable()
export class MoveInOutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly financeService: FinanceService,
  ) {}

  private generateMoveInNumber(): string {
    const year = new Date().getFullYear();
    const rand = randomBytes(5).toString('hex').toUpperCase();
    return 'MOV-IN-' + year + '-' + rand;
  }

  private generateMoveOutNumber(): string {
    const year = new Date().getFullYear();
    const rand = randomBytes(5).toString('hex').toUpperCase();
    return 'MOV-OUT-' + year + '-' + rand;
  }

  // ==================== MOVE-IN ====================

  async getResidentMoveInRequests(societyId: string, residentId: string) {
    return this.prisma.moveInRequest.findMany({
      where: { societyId, residentId },
      include: {
        property: { select: { block: true, propertyNumber: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMoveInRequest(
    societyId: string,
    residentId: string,
    userId: string,
    dto: CreateMoveInRequestDto,
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, societyId, active: true },
    });
    if (!property) {
      throw new NotFoundException('Property not found in this society.');
    }

    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, propertyId: dto.propertyId },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found in specified property.');
    }

    let attempts = 0;
    const maxAttempts = 3;
    let request = null;

    while (attempts < maxAttempts) {
      try {
        const requestNumber = this.generateMoveInNumber();
        request = await this.prisma.moveInRequest.create({
          data: {
            societyId,
            residentId,
            propertyId: dto.propertyId,
            unitId: dto.unitId,
            requestNumber,
            occupancyType: dto.occupancyType,
            desiredMoveInDate: new Date(dto.desiredMoveInDate),
            notes: dto.notes || null,
            metadata: (dto.metadata as Prisma.InputJsonValue) || Prisma.DbNull,
            status: MoveInRequestStatus.SUBMITTED,
          },
        });
        break;
      } catch (err: any) {
        if (
          err?.code === 'P2002' &&
          (err?.meta?.target?.includes('request_number') ||
            err?.meta?.target?.includes('requestNumber'))
        ) {
          attempts++;
          if (attempts >= maxAttempts) throw err;
          continue;
        }
        throw err;
      }
    }

    if (!request) {
      throw new BadRequestException(
        'Could not generate a unique request number. Please try again.',
      );
    }

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'MOVE_IN_REQUEST_CREATED',
      targetType: 'MoveInRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        requestNumber: request.requestNumber,
        occupancyType: dto.occupancyType,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'MOVE_IN_SUBMITTED',
      targetType: 'MoveInRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: { requestNumber: request.requestNumber },
    });

    return request;
  }

  async getAdminMoveInRequests(
    societyId: string,
    status?: MoveInRequestStatus,
  ) {
    return this.prisma.moveInRequest.findMany({
      where: {
        societyId,
        ...(status ? { status } : {}),
      },
      include: {
        resident: true,
        property: true,
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewMoveIn(
    societyId: string,
    id: string,
    reviewerUserId: string,
    dto: ReviewMoveInRequestDto,
  ) {
    const request = await this.prisma.moveInRequest.findFirst({
      where: { id, societyId },
      include: { resident: true },
    });
    if (!request) {
      throw new NotFoundException('Move-in request not found.');
    }

    const newStatus =
      dto.status === 'APPROVED'
        ? MoveInRequestStatus.APPROVED
        : dto.status === 'REJECTED'
          ? MoveInRequestStatus.REJECTED
          : MoveInRequestStatus.UNDER_REVIEW;

    const updated = await this.prisma.moveInRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedByUserId: reviewerUserId,
        rejectionReason:
          newStatus === MoveInRequestStatus.REJECTED
            ? dto.rejectionReason
            : null,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: reviewerUserId,
      action:
        newStatus === MoveInRequestStatus.APPROVED
          ? 'MOVE_IN_APPROVED'
          : 'MOVE_IN_REJECTED',
      targetType: 'MoveInRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: { requestNumber: request.requestNumber, status: newStatus },
    });

    return updated;
  }

  async completeMoveIn(societyId: string, id: string, reviewerUserId: string) {
    const request = await this.prisma.moveInRequest.findFirst({
      where: { id, societyId },
      include: { resident: true },
    });
    if (!request) {
      throw new NotFoundException('Move-in request not found.');
    }

    if (request.status !== MoveInRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Move-in request must be APPROVED before it can be completed.',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingActiveOccupancy = await tx.residentOccupancy.findFirst({
          where: {
            unitId: request.unitId,
            endDate: null,
            primaryResident: true,
          },
        });
        if (
          existingActiveOccupancy &&
          existingActiveOccupancy.residentId !== request.residentId
        ) {
          throw new ConflictException(
            'This unit already has an active primary occupant.',
          );
        }

        await tx.residentOccupancy.create({
          data: {
            residentId: request.residentId,
            unitId: request.unitId,
            occupancyType: request.occupancyType,
            startDate: request.desiredMoveInDate,
            endDate: null,
            primaryResident: true,
          },
        });

        await tx.resident.update({
          where: { id: request.residentId },
          data: { status: 'ACTIVE' },
        });

        const updated = await tx.moveInRequest.update({
          where: { id },
          data: { status: MoveInRequestStatus.COMPLETED },
        });

        await this.audit.recordSafely({
          societyId,
          actorUserId: reviewerUserId,
          action: 'MOVE_IN_COMPLETED',
          targetType: 'MoveInRequest',
          targetId: request.id,
          outcome: 'SUCCESS',
          safeMetadata: { requestNumber: request.requestNumber },
        });

        return updated;
      });
    } catch (err: any) {
      if (
        err?.code === 'P2002' ||
        err?.message?.includes('uk_resident_occupancy_unit_active_primary') ||
        err?.message?.includes('one_active_primary_occupancy_per_unit')
      ) {
        throw new ConflictException(
          'This unit already has an active primary occupant.',
        );
      }
      throw err;
    }
  }

  // ==================== MOVE-OUT ====================

  async getResidentMoveOutRequests(societyId: string, residentId: string) {
    return this.prisma.moveOutRequest.findMany({
      where: { societyId, residentId },
      include: {
        property: { select: { block: true, propertyNumber: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMoveOutRequest(
    societyId: string,
    residentId: string,
    userId: string,
    dto: CreateMoveOutRequestDto,
  ) {
    const occupancy = await this.prisma.residentOccupancy.findFirst({
      where: {
        residentId,
        unitId: dto.unitId,
        unit: { propertyId: dto.propertyId },
        endDate: null,
      },
    });
    if (!occupancy) {
      throw new BadRequestException(
        'Active occupancy not found for the specified unit.',
      );
    }

    let attempts = 0;
    const maxAttempts = 3;
    let request = null;

    while (attempts < maxAttempts) {
      try {
        const requestNumber = this.generateMoveOutNumber();
        request = await this.prisma.moveOutRequest.create({
          data: {
            societyId,
            residentId,
            propertyId: dto.propertyId,
            unitId: dto.unitId,
            requestNumber,
            desiredMoveOutDate: new Date(dto.desiredMoveOutDate),
            notes: dto.notes || null,
            status: MoveOutRequestStatus.SUBMITTED,
          },
        });
        break;
      } catch (err: any) {
        if (
          err?.code === 'P2002' &&
          (err?.meta?.target?.includes('request_number') ||
            err?.meta?.target?.includes('requestNumber'))
        ) {
          attempts++;
          if (attempts >= maxAttempts) throw err;
          continue;
        }
        throw err;
      }
    }

    if (!request) {
      throw new BadRequestException(
        'Could not generate a unique request number. Please try again.',
      );
    }

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'MOVE_OUT_REQUEST_CREATED',
      targetType: 'MoveOutRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: { requestNumber: request.requestNumber },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'MOVE_OUT_SUBMITTED',
      targetType: 'MoveOutRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: { requestNumber: request.requestNumber },
    });

    return request;
  }

  async getAdminMoveOutRequests(
    societyId: string,
    status?: MoveOutRequestStatus,
  ) {
    return this.prisma.moveOutRequest.findMany({
      where: {
        societyId,
        ...(status ? { status } : {}),
      },
      include: {
        resident: true,
        property: true,
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMoveOutClearance(
    societyId: string,
    id: string,
    reviewerUserId: string,
    dto: UpdateMoveOutClearanceDto,
  ) {
    const request = await this.prisma.moveOutRequest.findFirst({
      where: { id, societyId },
    });
    if (!request) {
      throw new NotFoundException('Move-out request not found.');
    }

    const updated = await this.prisma.moveOutRequest.update({
      where: { id },
      data: {
        ...(dto.duesClearanceStatus
          ? { duesClearanceStatus: dto.duesClearanceStatus }
          : {}),
        ...(dto.parkingClearanceStatus
          ? { parkingClearanceStatus: dto.parkingClearanceStatus }
          : {}),
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: reviewerUserId,
      action: 'MOVE_OUT_CLEARANCE_UPDATED',
      targetType: 'MoveOutRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: {
        duesClearanceStatus: dto.duesClearanceStatus,
        parkingClearanceStatus: dto.parkingClearanceStatus,
      },
    });

    return updated;
  }

  async reviewMoveOut(
    societyId: string,
    id: string,
    reviewerUserId: string,
    dto: ReviewMoveOutRequestDto,
  ) {
    const request = await this.prisma.moveOutRequest.findFirst({
      where: { id, societyId },
    });
    if (!request) {
      throw new NotFoundException('Move-out request not found.');
    }

    const newStatus =
      dto.status === 'APPROVED'
        ? MoveOutRequestStatus.APPROVED
        : dto.status === 'REJECTED'
          ? MoveOutRequestStatus.REJECTED
          : MoveOutRequestStatus.UNDER_REVIEW;

    const updated = await this.prisma.moveOutRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedByUserId: reviewerUserId,
        rejectionReason:
          newStatus === MoveOutRequestStatus.REJECTED
            ? dto.rejectionReason
            : null,
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: reviewerUserId,
      action:
        newStatus === MoveOutRequestStatus.APPROVED
          ? 'MOVE_OUT_APPROVED'
          : 'MOVE_OUT_REJECTED',
      targetType: 'MoveOutRequest',
      targetId: request.id,
      outcome: 'SUCCESS',
      safeMetadata: { requestNumber: request.requestNumber, status: newStatus },
    });

    return updated;
  }

  async completeMoveOut(societyId: string, id: string, reviewerUserId: string) {
    const request = await this.prisma.moveOutRequest.findFirst({
      where: { id, societyId },
    });
    if (!request) {
      throw new NotFoundException('Move-out request not found.');
    }

    if (request.status !== MoveOutRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Move-out request must be APPROVED before it can be completed.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Recheck authoritative financial balance from canonical Finance domain
      const balanceCheck =
        await this.financeService.getResidentOutstandingBalance(
          societyId,
          request.residentId,
          tx,
        );
      if (!balanceCheck.isCleared && request.duesClearanceStatus !== 'WAIVED') {
        throw new BadRequestException(
          'Cannot complete move-out: Resident has outstanding unpaid ledger balance of ' +
            balanceCheck.balance +
            '.',
        );
      }

      // 1. Close occupancy
      await tx.residentOccupancy.updateMany({
        where: {
          residentId: request.residentId,
          unitId: request.unitId,
          endDate: null,
        },
        data: {
          endDate: request.desiredMoveOutDate,
          moveOutReason: 'MOVE_OUT_REQUEST_COMPLETED',
        },
      });

      // 2. Revoke active parking permits
      await tx.parkingPermit.updateMany({
        where: {
          residentId: request.residentId,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
          notes: 'Move-out completed',
        },
      });

      // 3. Mark request completed
      const updated = await tx.moveOutRequest.update({
        where: { id },
        data: { status: MoveOutRequestStatus.COMPLETED },
      });

      await this.audit.recordSafely({
        societyId,
        actorUserId: reviewerUserId,
        action: 'MOVE_OUT_COMPLETED',
        targetType: 'MoveOutRequest',
        targetId: request.id,
        outcome: 'SUCCESS',
        safeMetadata: { requestNumber: request.requestNumber },
      });

      return updated;
    });
  }
}

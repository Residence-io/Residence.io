import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  AuditOutcome,
  NotificationPriority,
  ParkingSpaceStatus,
  ParkingPermitStatus,
} from '../generated/prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ParkingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getResidentPermits(societyId: string, userId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId, userId },
    });
    if (!resident) {
      throw new BadRequestException('User is not a resident.');
    }
    return this.prisma.parkingPermit.findMany({
      where: { societyId, residentId: resident.id },
      include: {
        vehicle: true,
        parkingSpace: true,
      },
    });
  }

  async getAdminPermits(societyId: string) {
    return this.prisma.parkingPermit.findMany({
      where: { societyId },
      include: {
        vehicle: true,
        resident: true,
        parkingSpace: true,
      },
    });
  }

  async getAdminSpaces(societyId: string) {
    return this.prisma.parkingSpace.findMany({
      where: { societyId },
    });
  }

  async issuePermit(
    societyId: string,
    adminUserId: string,
    data: {
      vehicleId: string;
      residentId: string;
      permitNumber: string;
      parkingSpaceId?: string;
      validUntil?: Date;
      notes?: string;
    },
  ) {
    const { permit } = await this.prisma.$transaction(async (tx) => {
      const p = await tx.parkingPermit.create({
        data: {
          societyId,
          vehicleId: data.vehicleId,
          residentId: data.residentId,
          permitNumber: data.permitNumber,
          parkingSpaceId: data.parkingSpaceId,
          validUntil: data.validUntil,
          notes: data.notes,
          issuedByUserId: adminUserId,
          status: ParkingPermitStatus.ACTIVE,
        },
      });

      if (data.parkingSpaceId) {
        await tx.parkingSpace.update({
          where: { id: data.parkingSpaceId, societyId },
          data: { status: ParkingSpaceStatus.ASSIGNED },
        });
      }

      const userAcc = await tx.userAccount.findFirst({
        where: { societyId, resident: { id: data.residentId } },
      });
      if (userAcc) {
        await tx.notification.create({
          data: {
            societyId,
            notificationType: 'PARKING_PERMIT_ISSUED',
            subject: 'Parking Permit Issued',
            renderedContent: `A parking permit (${data.permitNumber}) has been issued for your vehicle.`,
            priority: NotificationPriority.NORMAL,
            idempotencyKey: crypto.randomUUID(),
            recipients: {
              create: {
                userId: userAcc.id,
                residentId: data.residentId,
              },
            },
          },
        });
      }

      return { permit: p, user: userAcc };
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: adminUserId,
      action: 'PARKING_PERMIT_ISSUE',
      targetType: 'ParkingPermit',
      targetId: permit.id,
      outcome: AuditOutcome.SUCCESS,
      safeMetadata: { permitNumber: data.permitNumber },
    });

    return permit;
  }
}

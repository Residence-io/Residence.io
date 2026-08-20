import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  ParcelStatus,
  AuditOutcome,
  NotificationPriority,
} from '../generated/prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getResidentParcelsByUser(societyId: string, userId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId, userId },
    });
    if (!resident) {
      throw new BadRequestException('User is not a resident.');
    }
    return this.prisma.parcel.findMany({
      where: { societyId, residentId: resident.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResidentParcels(societyId: string, residentId: string) {
    return this.prisma.parcel.findMany({
      where: { societyId, residentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminParcels(societyId: string) {
    return this.prisma.parcel.findMany({
      where: { societyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGuardParcels(societyId: string) {
    return this.prisma.parcel.findMany({
      where: {
        societyId,
        status: {
          in: [ParcelStatus.WAITING_COLLECTION, ParcelStatus.RECEIVED],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createParcel(
    societyId: string,
    guardUserId: string,
    data: {
      residentId: string;
      courierName: string;
      trackingNumber?: string;
      description?: string;
      packageType?: string;
      unitId?: string;
      photoObjectKey?: string;
      notes?: string;
    },
  ) {
    const { parcel } = await this.prisma.$transaction(async (tx) => {
      const p = await tx.parcel.create({
        data: {
          societyId,
          guardUserId,
          residentId: data.residentId,
          courierName: data.courierName,
          trackingNumber: data.trackingNumber,
          description: data.description,
          packageType: data.packageType,
          unitId: data.unitId,
          photoObjectKey: data.photoObjectKey,
          notes: data.notes,
          status: ParcelStatus.WAITING_COLLECTION,
        },
      });

      const user = await tx.userAccount.findFirst({
        where: { societyId, resident: { id: data.residentId } },
      });
      if (user) {
        await tx.notification.create({
          data: {
            societyId,
            notificationType: 'PARCEL_ARRIVED',
            subject: 'Your parcel has arrived',
            renderedContent: `Your parcel from ${data.courierName} has arrived at the gate and is waiting for collection.`,
            priority: NotificationPriority.NORMAL,
            idempotencyKey: crypto.randomUUID(),
            recipients: {
              create: {
                userId: user.id,
                residentId: data.residentId,
              },
            },
          },
        });
      }

      return { parcel: p, userAccount: user };
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: guardUserId,
      action: 'DELIVERY_CREATE',
      targetType: 'Parcel',
      targetId: parcel.id,
      outcome: AuditOutcome.SUCCESS,
      safeMetadata: { trackingNumber: data.trackingNumber },
    });

    return parcel;
  }

  async collectParcel(societyId: string, parcelId: string, userId: string) {
    const { parcel } = await this.prisma.$transaction(async (tx) => {
      const result = await tx.parcel.updateMany({
        where: {
          id: parcelId,
          societyId,
          status: ParcelStatus.WAITING_COLLECTION,
        },
        data: {
          status: ParcelStatus.COLLECTED,
          collectedAt: new Date(),
        },
      });

      if (result.count === 0) {
        throw new BadRequestException('Parcel not found or already collected.');
      }

      const p = await tx.parcel.findUniqueOrThrow({
        where: { id: parcelId },
      });

      const user = await tx.userAccount.findFirst({
        where: { societyId, resident: { id: p.residentId } },
      });
      if (user) {
        await tx.notification.create({
          data: {
            societyId,
            notificationType: 'PARCEL_COLLECTED',
            subject: 'Parcel Collected',
            renderedContent: `Your parcel from ${p.courierName} has been successfully collected.`,
            priority: NotificationPriority.NORMAL,
            idempotencyKey: crypto.randomUUID(),
            recipients: {
              create: {
                userId: user.id,
                residentId: p.residentId,
              },
            },
          },
        });
      }

      return { parcel: p, userAccount: user };
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'DELIVERY_COLLECT',
      targetType: 'Parcel',
      targetId: parcel.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return parcel;
  }

  async returnParcel(societyId: string, parcelId: string, userId: string) {
    const parcel = await this.prisma.$transaction(async (tx) => {
      const result = await tx.parcel.updateMany({
        where: {
          id: parcelId,
          societyId,
          status: {
            in: [ParcelStatus.RECEIVED, ParcelStatus.WAITING_COLLECTION],
          },
        },
        data: {
          status: ParcelStatus.RETURNED,
          returnedAt: new Date(),
        },
      });

      if (result.count === 0) {
        throw new BadRequestException(
          'Parcel not found or cannot be returned.',
        );
      }

      return tx.parcel.findUniqueOrThrow({ where: { id: parcelId } });
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'DELIVERY_RETURN',
      targetType: 'Parcel',
      targetId: parcel.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return parcel;
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditOutcome, NotificationPriority } from '../generated/prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getResidentVehicles(societyId: string, userId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { societyId, userId },
    });
    if (!resident) {
      throw new BadRequestException('User is not a resident.');
    }
    return this.prisma.vehicle.findMany({
      where: { societyId, residentId: resident.id, active: true },
    });
  }

  async getAdminVehicles(societyId: string) {
    return this.prisma.vehicle.findMany({
      where: { societyId },
    });
  }

  async createVehicle(
    societyId: string,
    userId: string,
    data: {
      type: string;
      registrationNumber: string;
      name?: string;
      manufacturer?: string;
      model?: string;
      colour?: string;
    },
  ) {
    const vehicle = await this.prisma.$transaction(async (tx) => {
      const resident = await tx.resident.findFirst({
        where: { societyId, userId },
      });
      if (!resident) {
        throw new BadRequestException('User is not a resident.');
      }

      const normalizedRegistrationNumber = data.registrationNumber
        .replace(/\s+/g, '')
        .toUpperCase();

      return tx.vehicle.create({
        data: {
          societyId,
          residentId: resident.id,
          type: data.type,
          registrationNumber: data.registrationNumber,
          normalizedRegistrationNumber,
          name: data.name,
          manufacturer: data.manufacturer,
          model: data.model,
          colour: data.colour,
          active: false,
        },
      });
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: userId,
      action: 'VEHICLE_CREATE',
      targetType: 'Vehicle',
      targetId: vehicle.id,
      outcome: AuditOutcome.SUCCESS,
      safeMetadata: { registrationNumber: data.registrationNumber },
    });

    return vehicle;
  }

  async approveVehicle(
    societyId: string,
    vehicleId: string,
    adminUserId: string,
  ) {
    const { vehicle } = await this.prisma.$transaction(async (tx) => {
      const v = await tx.vehicle.update({
        where: { id: vehicleId, societyId },
        data: { active: true, deactivatedAt: null },
      });

      const userAcc = await tx.userAccount.findFirst({
        where: { societyId, resident: { id: v.residentId } },
      });
      if (userAcc) {
        await tx.notification.create({
          data: {
            societyId,
            notificationType: 'VEHICLE_APPROVED',
            subject: 'Vehicle Approved',
            renderedContent: `Your vehicle ${v.registrationNumber} has been approved.`,
            priority: NotificationPriority.NORMAL,
            idempotencyKey: crypto.randomUUID(),
            recipients: {
              create: {
                userId: userAcc.id,
                residentId: v.residentId,
              },
            },
          },
        });
      }

      return { vehicle: v, user: userAcc };
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: adminUserId,
      action: 'VEHICLE_APPROVE',
      targetType: 'Vehicle',
      targetId: vehicle.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return vehicle;
  }

  async rejectVehicle(
    societyId: string,
    vehicleId: string,
    adminUserId: string,
  ) {
    const { vehicle } = await this.prisma.$transaction(async (tx) => {
      const v = await tx.vehicle.update({
        where: { id: vehicleId, societyId },
        data: { active: false, deactivatedAt: new Date() },
      });

      const userAcc = await tx.userAccount.findFirst({
        where: { societyId, resident: { id: v.residentId } },
      });
      if (userAcc) {
        await tx.notification.create({
          data: {
            societyId,
            notificationType: 'VEHICLE_REJECTED',
            subject: 'Vehicle Rejected',
            renderedContent: `Your vehicle registration ${v.registrationNumber} has been rejected or deactivated.`,
            priority: NotificationPriority.NORMAL,
            idempotencyKey: crypto.randomUUID(),
            recipients: {
              create: {
                userId: userAcc.id,
                residentId: v.residentId,
              },
            },
          },
        });
      }

      return { vehicle: v, user: userAcc };
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: adminUserId,
      action: 'VEHICLE_REJECT',
      targetType: 'Vehicle',
      targetId: vehicle.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return vehicle;
  }

  async verifyVehicle(societyId: string, registrationNumber: string) {
    const normalizedRegistrationNumber = registrationNumber
      .replace(/\s+/g, '')
      .toUpperCase();
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { societyId, normalizedRegistrationNumber, active: true },
      include: {
        resident: {
          include: {
            user: {
              select: { displayName: true },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found or inactive.');
    }

    return vehicle;
  }
}

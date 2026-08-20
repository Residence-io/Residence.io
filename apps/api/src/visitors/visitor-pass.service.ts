import { randomBytes, randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VisitorStatus } from '../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditOutcome } from '../generated/prisma/client';

export class CreateVisitorDto {
  visitorName!: string;
  visitorPhone!: string;
  purpose!: string;
  vehicleNumber?: string;
  numberOfGuests?: number;
  visitDate!: Date;
  windowStart?: Date;
  windowEnd?: Date;
  isRecurring?: boolean;
  recurringDays?: string;
  recurringUntil?: Date;
  notes?: string;
  unitId?: string;
}

export class CheckInDto {
  gate!: string;
  vehicleNumber?: string;
  notes?: string;
}

@Injectable()
export class VisitorPassService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private generatePassCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(randomInt(chars.length));
    }
    return code;
  }

  private generateQrToken(): string {
    return randomBytes(32).toString('hex');
  }

  async createPass(
    societyId: string,
    residentId: string,
    data: CreateVisitorDto,
  ) {
    let passCode = this.generatePassCode();
    let qrToken = this.generateQrToken();
    let retries = 3;

    while (retries > 0) {
      try {
        const pass = await this.prisma.visitorPass.create({
          data: {
            societyId,
            residentId,
            unitId: data.unitId,
            visitorName: data.visitorName,
            visitorPhone: data.visitorPhone,
            purpose: data.purpose,
            vehicleNumber: data.vehicleNumber,
            numberOfGuests: data.numberOfGuests ?? 1,
            visitDate: data.visitDate,
            windowStart: data.windowStart,
            windowEnd: data.windowEnd,
            passCode,
            qrToken,
            status: VisitorStatus.WAITING_APPROVAL, // Assuming approval workflow
            isRecurring: data.isRecurring ?? false,
            recurringDays: data.recurringDays,
            recurringUntil: data.recurringUntil,
            notes: data.notes,
          },
          include: {
            resident: { select: { userId: true } }
          }
        });

        await this.audit.recordSafely({
          societyId,
          actorUserId: pass.resident?.userId || undefined,
          action: 'VISITOR_INVITED',
          targetType: 'VisitorPass',
          targetId: pass.id,
          outcome: AuditOutcome.SUCCESS,
        });

        const admins = await this.prisma.userAccount.findMany({
          where: {
            societyId,
            roles: { some: { role: { code: 'ADMINISTRATOR' } } }
          },
          select: { id: true }
        });
        
        if (admins.length > 0) {
          await this.prisma.notification.create({
            data: {
              societyId,
              notificationType: 'SYSTEM_ALERT',
              subject: 'Visitor Awaiting Approval',
              renderedContent: `A new visitor pass for ${pass.visitorName} requires approval.`,
              relatedType: 'VisitorPass',
              relatedId: pass.id,
              status: 'SCHEDULED',
              idempotencyKey: `vis_${pass.id}_INVITED_${Date.now()}`,
              recipients: {
                create: admins.map(a => ({
                  userId: a.id,
                  readStatus: 'UNREAD'
                }))
              }
            }
          });
        }

        return pass;
      } catch (e: any) {
        if (e.code === 'P2002') {
          passCode = this.generatePassCode();
          qrToken = this.generateQrToken();
          retries--;
          continue;
        }
        throw e;
      }
    }
    throw new ConflictException('Failed to generate unique visitor pass');
  }

  async cancelPass(id: string, societyId: string, residentId: string, actorId: string) {
    const pass = await this.prisma.visitorPass.findUnique({
      where: { id },
    });
    if (!pass || pass.societyId !== societyId) {
      throw new NotFoundException('Visitor pass not found');
    }
    if (pass.residentId !== residentId) {
      throw new ForbiddenException('You do not own this pass');
    }
    if (
      pass.status === VisitorStatus.CHECKED_IN ||
      pass.status === VisitorStatus.CHECKED_OUT
    ) {
      throw new BadRequestException(
        'Cannot cancel a pass that has already been used',
      );
    }

    const updated = await this.prisma.visitorPass.update({
      where: { id },
      data: { status: VisitorStatus.CANCELLED },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: actorId,
      action: 'VISITOR_CANCELLED',
      targetType: 'VisitorPass',
      targetId: id,
      outcome: AuditOutcome.SUCCESS,
    });

    return updated;
  }

  async getMyPasses(societyId: string, residentId: string) {
    return this.prisma.visitorPass.findMany({
      where: { societyId, residentId },
      orderBy: { visitDate: 'desc' },
      include: {
        checkIns: {
          orderBy: { checkedInAt: 'desc' },
        },
      },
    });
  }

  async getMyPass(id: string, societyId: string, residentId: string) {
    const pass = await this.prisma.visitorPass.findUnique({
      where: { id },
      include: {
        checkIns: {
          orderBy: { checkedInAt: 'desc' },
        },
      },
    });
    if (
      !pass ||
      pass.societyId !== societyId ||
      pass.residentId !== residentId
    ) {
      throw new NotFoundException('Visitor pass not found');
    }
    return pass;
  }

  async findByPassCode(societyId: string, passCode: string) {
    const pass = await this.prisma.visitorPass.findUnique({
      where: { passCode },
      include: {
        resident: {
          select: { id: true, fullName: true, primaryPhone: true },
        },
        unit: {
          select: { id: true, unitNumber: true },
        },
      },
    });
    if (!pass || pass.societyId !== societyId) {
      throw new NotFoundException('Invalid pass code');
    }
    return pass;
  }

  async findByQrToken(societyId: string, qrToken: string) {
    const pass = await this.prisma.visitorPass.findUnique({
      where: { qrToken },
      include: {
        resident: {
          select: { id: true, fullName: true, primaryPhone: true },
        },
        unit: {
          select: { id: true, unitNumber: true },
        },
      },
    });
    if (!pass || pass.societyId !== societyId) {
      throw new NotFoundException('Invalid QR token');
    }
    return pass;
  }

  async checkIn(
    id: string,
    societyId: string,
    guardUserId: string,
    data: CheckInDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const pass = await tx.visitorPass.findUnique({
          where: { id },
          include: {
            resident: { select: { userId: true } }
          }
        });

        if (!pass || pass.societyId !== societyId) {
          throw new NotFoundException('Visitor pass not found');
        }

        if (
          pass.status === VisitorStatus.CANCELLED ||
          pass.status === VisitorStatus.EXPIRED ||
          pass.status === VisitorStatus.REJECTED
        ) {
          throw new BadRequestException('Pass is invalid or expired');
        }

        const checkIn = await tx.visitorCheckIn.create({
          data: {
            societyId,
            visitorPassId: id,
            gate: data.gate,
            guardUserId,
            vehicleNumber: data.vehicleNumber ?? pass.vehicleNumber,
            notes: data.notes,
          },
        });

        await tx.visitorPass.update({
          where: { id },
          data: { status: VisitorStatus.CHECKED_IN },
        });
        
        await tx.auditLog.create({
          data: {
            societyId,
            actorUserId: guardUserId,
            action: 'VISITOR_CHECKED_IN',
            targetType: 'VisitorPass',
            targetId: id,
            outcome: AuditOutcome.SUCCESS,
          }
        });

        if (pass.resident?.userId) {
          await tx.notification.create({
            data: {
              societyId,
              notificationType: 'SYSTEM_ALERT',
              subject: 'Visitor Arrived',
              renderedContent: `Your visitor ${pass.visitorName} has checked in at ${data.gate}.`,
              relatedType: 'VisitorPass',
              relatedId: pass.id,
              status: 'SCHEDULED',
              idempotencyKey: `vis_${pass.id}_CHK_IN_${Date.now()}`,
              recipients: {
                create: [{
                  userId: pass.resident.userId,
                  readStatus: 'UNREAD'
                }]
              }
            }
          });
        }

        return checkIn;
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Visitor is already currently checked in');
      }
      throw e;
    }
  }

  async checkOut(checkInId: string, societyId: string, actorId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const checkIn = await tx.visitorCheckIn.findUnique({
          where: { id: checkInId },
          include: { visitorPass: { include: { resident: true } } },
        });

        if (!checkIn || checkIn.societyId !== societyId) {
          throw new NotFoundException('Check-in record not found');
        }

        const updateResult = await tx.visitorCheckIn.updateMany({
          where: { id: checkInId, checkedOutAt: null },
          data: { checkedOutAt: new Date() },
        });

        if (updateResult.count === 0) {
          throw new ConflictException('Visitor is already checked out');
        }

        const newStatus = checkIn.visitorPass.isRecurring
          ? VisitorStatus.APPROVED
          : VisitorStatus.CHECKED_OUT;

        await tx.visitorPass.update({
          where: { id: checkIn.visitorPassId },
          data: { status: newStatus },
        });
        
        await tx.auditLog.create({
          data: {
            societyId,
            actorUserId: actorId,
            action: 'VISITOR_CHECKED_OUT',
            targetType: 'VisitorPass',
            targetId: checkIn.visitorPassId,
            outcome: AuditOutcome.SUCCESS,
          }
        });

        return { success: true };
      });
    } catch (e) {
      throw e;
    }
  }

  async getCurrentlyInside(societyId: string) {
    return this.prisma.visitorCheckIn.findMany({
      where: {
        societyId,
        checkedOutAt: null,
      },
      include: {
        visitorPass: {
          include: {
            resident: { select: { fullName: true, primaryPhone: true } },
            unit: { select: { unitNumber: true } },
          },
        },
      },
      orderBy: { checkedInAt: 'desc' },
    });
  }

  async getAdminVisitorPasses(societyId: string) {
    return this.prisma.visitorPass.findMany({
      where: { societyId },
      include: {
        resident: { select: { fullName: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async setAdminStatus(id: string, societyId: string, status: VisitorStatus, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pass = await tx.visitorPass.findUnique({
        where: { id },
        include: { resident: true }
      });
      if (!pass || pass.societyId !== societyId) {
        throw new NotFoundException('Visitor pass not found');
      }
      
      const updated = await tx.visitorPass.update({
        where: { id },
        data: { status },
      });
      
      await tx.auditLog.create({
        data: {
          societyId,
          actorUserId: actorId,
          action: status === VisitorStatus.APPROVED ? 'VISITOR_APPROVED' : 'VISITOR_REJECTED',
          targetType: 'VisitorPass',
          targetId: id,
          outcome: AuditOutcome.SUCCESS,
        }
      });
      
      if (pass.resident?.userId) {
        await tx.notification.create({
          data: {
            societyId,
            notificationType: 'SYSTEM_ALERT',
            subject: `Visitor ${status.toString().toLowerCase()}`,
            renderedContent: `Your visitor ${pass.visitorName} has been ${status.toString().toLowerCase()}.`,
            relatedType: 'VisitorPass',
            relatedId: pass.id,
            status: 'SCHEDULED',
            idempotencyKey: `vis_${pass.id}_${status}_${Date.now()}`,
            recipients: {
              create: [{
                userId: pass.resident.userId,
                readStatus: 'UNREAD'
              }]
            }
          }
        });
      }
      return updated;
    });
  }
}

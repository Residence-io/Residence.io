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
  constructor(private readonly prisma: PrismaService) {}

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
    // Retry on collision for unique pass code/token
    let passCode = this.generatePassCode();
    let qrToken = this.generateQrToken();
    let retries = 3;

    while (retries > 0) {
      try {
        return await this.prisma.visitorPass.create({
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
            status: VisitorStatus.APPROVED, // Default behavior per plan
            isRecurring: data.isRecurring ?? false,
            recurringDays: data.recurringDays,
            recurringUntil: data.recurringUntil,
            notes: data.notes,
          },
        });
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

  async cancelPass(id: string, societyId: string, residentId: string) {
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

    return this.prisma.visitorPass.update({
      where: { id },
      data: { status: VisitorStatus.CANCELLED },
    });
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
    return this.prisma.$transaction(async (tx) => {
      const pass = await tx.visitorPass.findUnique({
        where: { id },
        include: {
          checkIns: {
            where: { checkedOutAt: null },
          },
        },
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

      if (
        pass.status === VisitorStatus.CHECKED_IN ||
        pass.checkIns.length > 0
      ) {
        throw new BadRequestException('Visitor is already checked in');
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

      return checkIn;
    });
  }

  async checkOut(checkInId: string, societyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const checkIn = await tx.visitorCheckIn.findUnique({
        where: { id: checkInId },
        include: { visitorPass: true },
      });

      if (!checkIn || checkIn.societyId !== societyId) {
        throw new NotFoundException('Check-in record not found');
      }

      if (checkIn.checkedOutAt) {
        throw new BadRequestException('Visitor is already checked out');
      }

      await tx.visitorCheckIn.update({
        where: { id: checkInId },
        data: { checkedOutAt: new Date() },
      });

      // Optionally revert the pass to APPROVED if it's recurring. For Phase 2 simplicity, keep it CHECKED_OUT or APPROVED.
      // We will set to APPROVED if recurring, otherwise CHECKED_OUT.
      const newStatus = checkIn.visitorPass.isRecurring
        ? VisitorStatus.APPROVED
        : VisitorStatus.CHECKED_OUT;

      await tx.visitorPass.update({
        where: { id: checkIn.visitorPassId },
        data: { status: newStatus },
      });

      return { success: true };
    });
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

  async setAdminStatus(id: string, societyId: string, status: VisitorStatus) {
    const pass = await this.prisma.visitorPass.findUnique({
      where: { id },
    });
    if (!pass || pass.societyId !== societyId) {
      throw new NotFoundException('Visitor pass not found');
    }
    return this.prisma.visitorPass.update({
      where: { id },
      data: { status },
    });
  }
}

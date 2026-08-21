import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  FacilityStatus,
  FacilityBookingStatus,
  AuditOutcome,
  NotificationPriority,
} from '../generated/prisma/client';
import {
  CreateBookingDto,
  CancelBookingDto,
  RejectBookingDto,
  QueryBookingsDto,
} from './dto/facility.dto';
import * as crypto from 'crypto';

export interface TimeSlot {
  startsAt: string;
  endsAt: string;
  available: boolean;
  reason?: string;
}

@Injectable()
export class FacilityBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getFacilityAvailability(
    societyId: string,
    facilityId: string,
    dateStr: string,
  ): Promise<{
    facility: { id: string; name: string; status: FacilityStatus };
    date: string;
    slots: TimeSlot[];
  }> {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility || facility.societyId !== societyId) {
      throw new NotFoundException('Facility not found.');
    }

    if (facility.status !== FacilityStatus.ACTIVE) {
      return {
        facility: {
          id: facility.id,
          name: facility.name,
          status: facility.status,
        },
        date: dateStr,
        slots: [],
      };
    }

    // Parse dateStr (YYYY-MM-DD)
    const targetDate = new Date(dateStr + 'T00:00:00.000Z');
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Expected YYYY-MM-DD.',
      );
    }

    const dayStart = new Date(dateStr + 'T00:00:00.000Z');
    const dayEnd = new Date(dateStr + 'T23:59:59.999Z');

    // Existing active bookings for this date range
    const existingBookings = await this.prisma.facilityBooking.findMany({
      where: {
        societyId,
        facilityId,
        status: {
          in: [FacilityBookingStatus.PENDING, FacilityBookingStatus.CONFIRMED],
        },
        startsAt: { lte: dayEnd },
        endsAt: { gte: dayStart },
      },
    });

    // Existing blockouts
    const blockouts = await this.prisma.facilityBlockout.findMany({
      where: {
        societyId,
        facilityId,
        startsAt: { lte: dayEnd },
        endsAt: { gte: dayStart },
      },
    });

    // Parse opening and closing time (HH:mm)
    const [openH, openM] = facility.openingTime.split(':').map(Number);
    const [closeH, closeM] = facility.closingTime.split(':').map(Number);
    const durationMinutes = facility.bookingDurationMinutes || 60;

    const slots: TimeSlot[] = [];
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    const now = new Date();

    for (
      let m = openMinutes;
      m + durationMinutes <= closeMinutes;
      m += durationMinutes
    ) {
      const slotStartH = Math.floor(m / 60);
      const slotStartM = m % 60;
      const slotEndH = Math.floor((m + durationMinutes) / 60);
      const slotEndM = (m + durationMinutes) % 60;

      const slotStartTime = new Date(
        Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate(),
          slotStartH,
          slotStartM,
          0,
        ),
      );
      const slotEndTime = new Date(
        Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate(),
          slotEndH,
          slotEndM,
          0,
        ),
      );

      let available = true;
      let reason: string | undefined;

      if (slotStartTime < now) {
        available = false;
        reason = 'Past time';
      } else {
        const isBooked = existingBookings.some(
          (b) => b.startsAt < slotEndTime && b.endsAt > slotStartTime,
        );
        if (isBooked) {
          available = false;
          reason = 'Booked';
        } else {
          const isBlocked = blockouts.some(
            (blk) => blk.startsAt < slotEndTime && blk.endsAt > slotStartTime,
          );
          if (isBlocked) {
            available = false;
            reason = 'Blocked';
          }
        }
      }

      slots.push({
        startsAt: slotStartTime.toISOString(),
        endsAt: slotEndTime.toISOString(),
        available,
        reason,
      });
    }

    return {
      facility: {
        id: facility.id,
        name: facility.name,
        status: facility.status,
      },
      date: dateStr,
      slots,
    };
  }

  async getResidentBookings(
    societyId: string,
    residentId: string,
    status?: FacilityBookingStatus,
  ) {
    return this.prisma.facilityBooking.findMany({
      where: {
        societyId,
        residentId,
        ...(status ? { status } : {}),
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            location: true,
            category: true,
            bookingFee: true,
            currency: true,
            rules: true,
            cancellationPolicy: true,
          },
        },
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  async getResidentBookingById(
    societyId: string,
    residentId: string,
    bookingId: string,
  ) {
    const booking = await this.prisma.facilityBooking.findUnique({
      where: { id: bookingId },
      include: {
        facility: true,
      },
    });

    if (
      !booking ||
      booking.societyId !== societyId ||
      booking.residentId !== residentId
    ) {
      throw new NotFoundException('Booking not found.');
    }

    return booking;
  }

  async createBooking(
    societyId: string,
    residentId: string,
    dto: CreateBookingDto,
  ) {
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });

    if (!facility || facility.societyId !== societyId) {
      throw new NotFoundException('Facility not found.');
    }

    if (facility.status !== FacilityStatus.ACTIVE) {
      throw new BadRequestException(
        'Facility is currently ' +
          facility.status.toLowerCase().replace('_', ' ') +
          ' and unavailable for booking.',
      );
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const bookingDate = new Date(dto.bookingDate);

    if (
      isNaN(startsAt.getTime()) ||
      isNaN(endsAt.getTime()) ||
      startsAt >= endsAt
    ) {
      throw new BadRequestException('Invalid start or end time.');
    }

    if (startsAt < new Date()) {
      throw new BadRequestException('Cannot book time in the past.');
    }

    if (
      dto.guestCount &&
      facility.capacity &&
      dto.guestCount > facility.capacity
    ) {
      throw new BadRequestException(
        `Guest count (${dto.guestCount}) exceeds facility capacity (${facility.capacity}).`,
      );
    }

    // Check advance booking days
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(
      maxAdvanceDate.getDate() + facility.advanceBookingDays,
    );
    if (startsAt > maxAdvanceDate) {
      throw new BadRequestException(
        `Bookings are only allowed up to ${facility.advanceBookingDays} days in advance.`,
      );
    }

    const initialStatus = facility.requiresApproval
      ? FacilityBookingStatus.PENDING
      : FacilityBookingStatus.CONFIRMED;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Check for overlapping blockouts
        const blockoutConflict = await tx.facilityBlockout.findFirst({
          where: {
            societyId,
            facilityId: facility.id,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        });

        if (blockoutConflict) {
          throw new ConflictException(
            'This facility is blocked during the selected time period.',
          );
        }

        // 2. Check for overlapping active bookings (double booking check in app layer)
        const bookingConflict = await tx.facilityBooking.findFirst({
          where: {
            societyId,
            facilityId: facility.id,
            status: {
              in: [
                FacilityBookingStatus.PENDING,
                FacilityBookingStatus.CONFIRMED,
              ],
            },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        });

        if (bookingConflict) {
          throw new ConflictException(
            'This facility is already booked for the selected time.',
          );
        }

        // 3. Create the booking
        const booking = await tx.facilityBooking.create({
          data: {
            societyId,
            facilityId: facility.id,
            residentId,
            bookingDate,
            startsAt,
            endsAt,
            guestCount: dto.guestCount,
            purpose: dto.purpose,
            notes: dto.notes,
            status: initialStatus,
            bookingFee: facility.bookingFee,
            depositAmount: facility.depositAmount,
            currency: facility.currency,
          },
          include: {
            facility: { select: { name: true } },
          },
        });

        // 4. Record Audit Log
        await tx.auditLog.create({
          data: {
            societyId,
            actorUserId:
              (
                await tx.resident.findUnique({
                  where: { id: residentId },
                  select: { userId: true },
                })
              )?.userId || residentId,
            action: 'FACILITY_BOOKING_CREATED',
            targetType: 'FacilityBooking',
            targetId: booking.id,
            outcome: AuditOutcome.SUCCESS,
            safeMetadata: {
              id: booking.id,
              facilityId: booking.facilityId,
              status: booking.status,
              startsAt: booking.startsAt,
              endsAt: booking.endsAt,
            },
          },
        });

        // 5. Send notification to resident
        const resident = await tx.resident.findUnique({
          where: { id: residentId },
          select: { userId: true },
        });

        if (resident?.userId) {
          const subject =
            initialStatus === FacilityBookingStatus.CONFIRMED
              ? 'Facility Booking Confirmed'
              : 'Facility Booking Submitted';
          const content =
            initialStatus === FacilityBookingStatus.CONFIRMED
              ? `Your booking for ${facility.name} on ${bookingDate.toISOString().slice(0, 10)} is confirmed.`
              : `Your booking for ${facility.name} on ${bookingDate.toISOString().slice(0, 10)} has been submitted for admin approval.`;

          await tx.notification.create({
            data: {
              societyId,
              notificationType: 'FACILITY_BOOKING',
              subject,
              renderedContent: content,
              priority: NotificationPriority.NORMAL,
              idempotencyKey: crypto.randomUUID(),
              recipients: {
                create: [
                  {
                    userId: resident.userId,
                    readStatus: 'UNREAD',
                  },
                ],
              },
            },
          });
        }

        return booking;
      });
    } catch (err: any) {
      if (
        err.code === '23P01' || // PostgreSQL exclusion_violation
        err.code === 'P2002' ||
        err.message?.includes('no_overlapping_active_facility_bookings')
      ) {
        throw new ConflictException(
          'This facility is already booked for the selected time.',
        );
      }
      throw err;
    }
  }

  async cancelResidentBooking(
    societyId: string,
    residentId: string,
    bookingId: string,
    dto: CancelBookingDto,
  ) {
    const booking = await this.getResidentBookingById(
      societyId,
      residentId,
      bookingId,
    );

    if (
      booking.status !== FacilityBookingStatus.PENDING &&
      booking.status !== FacilityBookingStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot cancel booking with status ${booking.status}.`,
      );
    }

    if (booking.startsAt <= new Date()) {
      throw new BadRequestException('Cannot cancel past or ongoing bookings.');
    }

    const updated = await this.prisma.facilityBooking.update({
      where: { id: booking.id },
      data: {
        status: FacilityBookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason ?? 'Cancelled by resident',
      },
    });

    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      select: { userId: true },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId: resident?.userId || residentId,
      action: 'FACILITY_BOOKING_CANCELLED',
      targetType: 'FacilityBooking',
      targetId: booking.id,
      outcome: AuditOutcome.SUCCESS,

      safeMetadata: { status: FacilityBookingStatus.CANCELLED },
    });

    return updated;
  }

  async getAdminBookings(societyId: string, query: QueryBookingsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where = {
      societyId,
      ...(query.facilityId ? { facilityId: query.facilityId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.date
        ? {
            bookingDate: new Date(query.date),
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.facilityBooking.count({ where }),
      this.prisma.facilityBooking.findMany({
        where,
        include: {
          facility: {
            select: { id: true, name: true, location: true, category: true },
          },
          resident: {
            select: {
              id: true,
              fullName: true,
              residentNumber: true,
              primaryPhone: true,
            },
          },
        },
        orderBy: { startsAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAdminBookingById(societyId: string, bookingId: string) {
    const booking = await this.prisma.facilityBooking.findUnique({
      where: { id: bookingId },
      include: {
        facility: true,
        resident: {
          select: {
            id: true,
            fullName: true,
            residentNumber: true,
            primaryPhone: true,
            email: true,
          },
        },
        approvedByUser: { select: { id: true, displayName: true } },
        cancelledByUser: { select: { id: true, displayName: true } },
      },
    });

    if (!booking || booking.societyId !== societyId) {
      throw new NotFoundException('Booking not found.');
    }

    return booking;
  }

  async approveBooking(
    societyId: string,
    bookingId: string,
    actorUserId: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const booking = await tx.facilityBooking.findUnique({
        where: { id: bookingId },
        include: { facility: true, resident: true },
      });

      if (!booking || booking.societyId !== societyId) {
        throw new NotFoundException('Booking not found.');
      }

      if (booking.status !== FacilityBookingStatus.PENDING) {
        throw new BadRequestException(
          `Cannot approve booking with status ${booking.status}.`,
        );
      }

      // Revalidate overlap with confirmed bookings
      const conflict = await tx.facilityBooking.findFirst({
        where: {
          societyId,
          facilityId: booking.facilityId,
          id: { not: booking.id },
          status: FacilityBookingStatus.CONFIRMED,
          startsAt: { lt: booking.endsAt },
          endsAt: { gt: booking.startsAt },
        },
      });

      if (conflict) {
        throw new ConflictException(
          'Cannot approve: Another confirmed booking already occupies this time slot.',
        );
      }

      const updated = await tx.facilityBooking.update({
        where: { id: bookingId },
        data: {
          status: FacilityBookingStatus.CONFIRMED,
          approvedByUserId: actorUserId,
          approvedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          societyId,
          actorUserId,
          action: 'FACILITY_BOOKING_APPROVED',
          targetType: 'FacilityBooking',
          targetId: bookingId,
          outcome: AuditOutcome.SUCCESS,
          safeMetadata: {
            status: FacilityBookingStatus.CONFIRMED,
            approvedByUserId: actorUserId,
          },
        },
      });

      if (booking.resident?.userId) {
        await tx.notification.create({
          data: {
            societyId,
            notificationType: 'FACILITY_BOOKING',
            subject: 'Facility Booking Approved',
            renderedContent: `Your booking for ${booking.facility.name} on ${booking.bookingDate.toISOString().slice(0, 10)} has been approved.`,
            priority: NotificationPriority.NORMAL,
            idempotencyKey: crypto.randomUUID(),
            recipients: {
              create: [
                { userId: booking.resident.userId, readStatus: 'UNREAD' },
              ],
            },
          },
        });
      }

      return updated;
    });
  }

  async rejectBooking(
    societyId: string,
    bookingId: string,
    actorUserId: string,
    dto: RejectBookingDto,
  ) {
    const booking = await this.prisma.facilityBooking.findUnique({
      where: { id: bookingId },
      include: { facility: true, resident: true },
    });

    if (!booking || booking.societyId !== societyId) {
      throw new NotFoundException('Booking not found.');
    }

    if (booking.status !== FacilityBookingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject booking with status ${booking.status}.`,
      );
    }

    const updated = await this.prisma.facilityBooking.update({
      where: { id: bookingId },
      data: {
        status: FacilityBookingStatus.REJECTED,
        cancellationReason: dto.reason ?? 'Rejected by administrator',
      },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId,
      action: 'FACILITY_BOOKING_REJECTED',
      targetType: 'FacilityBooking',
      targetId: bookingId,
      outcome: AuditOutcome.SUCCESS,
      safeMetadata: {
        status: FacilityBookingStatus.REJECTED,
        reason: dto.reason,
      },
    });

    if (booking.resident?.userId) {
      await this.prisma.notification.create({
        data: {
          societyId,
          notificationType: 'FACILITY_BOOKING',
          subject: 'Facility Booking Rejected',
          renderedContent: `Your booking request for ${booking.facility.name} on ${booking.bookingDate.toISOString().slice(0, 10)} was rejected. Reason: ${dto.reason || 'Not specified'}`,
          priority: NotificationPriority.NORMAL,
          idempotencyKey: crypto.randomUUID(),
          recipients: {
            create: [{ userId: booking.resident.userId, readStatus: 'UNREAD' }],
          },
        },
      });
    }

    return updated;
  }

  async completeBooking(
    societyId: string,
    bookingId: string,
    actorUserId: string,
  ) {
    const booking = await this.prisma.facilityBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.societyId !== societyId) {
      throw new NotFoundException('Booking not found.');
    }

    if (booking.status !== FacilityBookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot complete booking with status ${booking.status}.`,
      );
    }

    const updated = await this.prisma.facilityBooking.update({
      where: { id: bookingId },
      data: { status: FacilityBookingStatus.COMPLETED },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId,
      action: 'FACILITY_BOOKING_COMPLETED',
      targetType: 'FacilityBooking',
      targetId: bookingId,
      outcome: AuditOutcome.SUCCESS,
    });

    return updated;
  }

  async noShowBooking(
    societyId: string,
    bookingId: string,
    actorUserId: string,
  ) {
    const booking = await this.prisma.facilityBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.societyId !== societyId) {
      throw new NotFoundException('Booking not found.');
    }

    if (booking.status !== FacilityBookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot mark no-show for booking with status ${booking.status}.`,
      );
    }

    const updated = await this.prisma.facilityBooking.update({
      where: { id: bookingId },
      data: { status: FacilityBookingStatus.NO_SHOW },
    });

    await this.audit.recordSafely({
      societyId,
      actorUserId,
      action: 'FACILITY_BOOKING_NO_SHOW',
      targetType: 'FacilityBooking',
      targetId: bookingId,
      outcome: AuditOutcome.SUCCESS,
    });

    return updated;
  }
}

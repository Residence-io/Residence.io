import { FacilitiesService } from './facilities.service';
import { FacilityBookingsService } from './facility-bookings.service';
import {
  FacilityStatus,
  FacilityBookingStatus,
  AuditOutcome,
} from '../generated/prisma/client';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

describe('Facilities & Bookings Services', () => {
  const societyId = '11111111-1111-1111-1111-111111111111';
  const otherSocietyId = '22222222-2222-2222-2222-222222222222';
  const residentId = '33333333-3333-3333-3333-333333333333';
  const otherResidentId = '44444444-4444-4444-4444-444444444444';
  const actorUserId = '55555555-5555-5555-5555-555555555555';
  const facilityId = '66666666-6666-6666-6666-666666666666';

  let mockPrisma: any;
  let mockAudit: any;
  let facilitiesService: FacilitiesService;
  let bookingsService: FacilityBookingsService;

  beforeEach(() => {
    mockPrisma = {
      facility: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      facilityBlockout: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      facilityBooking: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      resident: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      userAccount: {
        findFirst: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    mockAudit = {
      recordSafely: jest.fn(),
    };

    facilitiesService = new FacilitiesService(mockPrisma, mockAudit);
    bookingsService = new FacilityBookingsService(mockPrisma, mockAudit);
  });

  describe('Facilities Management', () => {
    it('creates a facility and logs audit event', async () => {
      const facilityData = {
        name: 'Community Hall',
        category: 'Hall',
        capacity: 100,
        bookingFee: 5000,
      };

      mockPrisma.facility.create.mockResolvedValue({
        id: facilityId,
        societyId,
        status: FacilityStatus.ACTIVE,
        ...facilityData,
      });

      const result = await facilitiesService.createFacility(
        societyId,
        actorUserId,
        facilityData as any,
      );

      expect(result.id).toBe(facilityId);
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({
          societyId,
          action: 'FACILITY_CREATED',
          targetId: facilityId,
          outcome: AuditOutcome.SUCCESS,
        }),
      );
    });

    it('enforces society isolation on getFacilityById', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue({
        id: facilityId,
        societyId: otherSocietyId,
      });

      await expect(
        facilitiesService.getFacilityById(societyId, facilityId),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates blockout for maintenance or events', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue({
        id: facilityId,
        societyId,
      });

      const startsAt = new Date('2026-09-01T10:00:00Z');
      const endsAt = new Date('2026-09-01T14:00:00Z');

      mockPrisma.facilityBlockout.create.mockResolvedValue({
        id: 'block-1',
        facilityId,
        startsAt,
        endsAt,
        reason: 'Deep Cleaning',
      });

      const result = await facilitiesService.createBlockout(
        societyId,
        facilityId,
        actorUserId,
        {
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          reason: 'Deep Cleaning',
        },
      );

      expect(result.id).toBe('block-1');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FACILITY_BLOCKED',
          outcome: AuditOutcome.SUCCESS,
        }),
      );
    });
  });

  describe('Facility Booking & Overlap Protection', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dateStr = futureDate.toISOString().slice(0, 10);
    const startsAt = new Date(`${dateStr}T10:00:00.000Z`);
    const endsAt = new Date(`${dateStr}T11:00:00.000Z`);

    it('successfully books an available facility with auto-approval', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue({
        id: facilityId,
        societyId,
        status: FacilityStatus.ACTIVE,
        requiresApproval: false,
        advanceBookingDays: 30,
        bookingFee: 1000,
        depositAmount: 500,
        currency: 'PKR',
        name: 'Gym',
      });

      mockPrisma.resident.findUnique.mockResolvedValue({
        id: residentId,
        userId: actorUserId,
      });

      mockPrisma.facilityBlockout.findFirst.mockResolvedValue(null);
      mockPrisma.facilityBooking.findFirst.mockResolvedValue(null);

      mockPrisma.facilityBooking.create.mockResolvedValue({
        id: 'booking-1',
        facilityId,
        residentId,
        status: FacilityBookingStatus.CONFIRMED,
        startsAt,
        endsAt,
        facility: { name: 'Gym' },
      });

      const result = await bookingsService.createBooking(
        societyId,
        residentId,
        {
          facilityId,
          bookingDate: dateStr,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        },
      );

      expect(result.id).toBe('booking-1');
      expect(result.status).toBe(FacilityBookingStatus.CONFIRMED);
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('rejects booking when overlapping with an existing active booking', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue({
        id: facilityId,
        societyId,
        status: FacilityStatus.ACTIVE,
        advanceBookingDays: 30,
      });

      mockPrisma.facilityBlockout.findFirst.mockResolvedValue(null);
      mockPrisma.facilityBooking.findFirst.mockResolvedValue({
        id: 'existing-booking',
        facilityId,
        status: FacilityBookingStatus.CONFIRMED,
      });

      await expect(
        bookingsService.createBooking(societyId, residentId, {
          facilityId,
          bookingDate: dateStr,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects booking when facility is under maintenance', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue({
        id: facilityId,
        societyId,
        status: FacilityStatus.UNDER_MAINTENANCE,
        advanceBookingDays: 30,
      });

      await expect(
        bookingsService.createBooking(societyId, residentId, {
          facilityId,
          bookingDate: dateStr,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects booking when guest count exceeds capacity', async () => {
      mockPrisma.facility.findUnique.mockResolvedValue({
        id: facilityId,
        societyId,
        status: FacilityStatus.ACTIVE,
        capacity: 20,
        advanceBookingDays: 30,
      });

      await expect(
        bookingsService.createBooking(societyId, residentId, {
          facilityId,
          bookingDate: dateStr,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          guestCount: 50,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces resident ownership when viewing booking detail', async () => {
      mockPrisma.facilityBooking.findUnique.mockResolvedValue({
        id: 'booking-1',
        societyId,
        residentId: otherResidentId,
      });

      await expect(
        bookingsService.getResidentBookingById(
          societyId,
          residentId,
          'booking-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('cancels upcoming booking and creates audit log', async () => {
      mockPrisma.facilityBooking.findUnique.mockResolvedValue({
        id: 'booking-1',
        societyId,
        residentId,
        status: FacilityBookingStatus.CONFIRMED,
        startsAt: new Date(Date.now() + 86400000),
      });

      mockPrisma.facilityBooking.update.mockResolvedValue({
        id: 'booking-1',
        status: FacilityBookingStatus.CANCELLED,
      });

      mockPrisma.resident.findUnique.mockResolvedValue({
        id: residentId,
        userId: actorUserId,
      });

      const res = await bookingsService.cancelResidentBooking(
        societyId,
        residentId,
        'booking-1',
        { reason: 'Change of plans' },
      );

      expect(res.status).toBe(FacilityBookingStatus.CANCELLED);
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FACILITY_BOOKING_CANCELLED',
          outcome: AuditOutcome.SUCCESS,
        }),
      );
    });

    it('admin approves pending booking with re-validated overlap check', async () => {
      mockPrisma.facilityBooking.findUnique.mockResolvedValue({
        id: 'booking-pending',
        societyId,
        facilityId,
        status: FacilityBookingStatus.PENDING,
        bookingDate: new Date('2026-09-05'),
        startsAt,
        endsAt,
        facility: { name: 'Tennis Court' },
        resident: { userId: actorUserId },
      });

      mockPrisma.facilityBooking.findFirst.mockResolvedValue(null);
      mockPrisma.facilityBooking.update.mockResolvedValue({
        id: 'booking-pending',
        status: FacilityBookingStatus.CONFIRMED,
      });

      const res = await bookingsService.approveBooking(
        societyId,
        'booking-pending',
        actorUserId,
      );

      expect(res.status).toBe(FacilityBookingStatus.CONFIRMED);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });
  });
});

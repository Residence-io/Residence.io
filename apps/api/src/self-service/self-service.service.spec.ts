import { Test, TestingModule } from '@nestjs/testing';
import { ResidentDocumentsService } from './resident-documents.service';
import { ResidentRequestsService } from './resident-requests.service';
import { MoveInOutService } from './move-in-out.service';
import { CommunityService } from './community.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SelfServiceModule Services', () => {
  let docService: ResidentDocumentsService;
  let reqService: ResidentRequestsService;
  let moveService: MoveInOutService;
  let comService: CommunityService;

  const mockPrisma: any = {
    residentDocument: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    residentRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    moveInRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    moveOutRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    monthlyDue: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    communityEvent: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    emergencyContact: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    },
    resident: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    property: {
      findFirst: jest.fn(),
    },
    unit: {
      findFirst: jest.fn(),
    },
    residentOccupancy: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    parkingPermit: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockAudit = {
    recordSafely: jest.fn().mockResolvedValue(undefined),
  };

  const mockStorage = {
    store: jest.fn().mockResolvedValue({
      objectKey: 'res-1/mock.pdf',
      mediaType: 'application/pdf',
      sizeBytes: 100,
      checksumSha256: 'mocksha256',
      originalFileName: 'cnic.pdf',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResidentDocumentsService,
        ResidentRequestsService,
        MoveInOutService,
        CommunityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: PrivateStorageService, useValue: mockStorage },
      ],
    }).compile();

    docService = module.get<ResidentDocumentsService>(ResidentDocumentsService);
    reqService = module.get<ResidentRequestsService>(ResidentRequestsService);
    moveService = module.get<MoveInOutService>(MoveInOutService);
    comService = module.get<CommunityService>(CommunityService);
    jest.clearAllMocks();
  });

  describe('ResidentDocumentsService', () => {
    it('uploads a document and records audit', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue({
        id: 'res-1',
        societyId: 'soc-1',
      });
      mockPrisma.residentDocument.create.mockResolvedValue({
        id: 'doc-1',
        originalFileName: 'cnic.pdf',
        verificationStatus: 'PENDING',
      });

      const res = await docService.uploadResidentDocument(
        'soc-1',
        'res-1',
        'user-1',
        'IDENTITY_DOCUMENT' as any,
        Buffer.from('%PDF-test-content'),
        'cnic.pdf',
        'application/pdf',
        '42101-1234567-1',
      );

      expect(res.id).toBe('doc-1');
      expect(mockStorage.store).toHaveBeenCalled();
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RESIDENT_DOCUMENT_UPLOADED' }),
      );
    });

    it('reviews a document and notifies resident', async () => {
      mockPrisma.residentDocument.findFirst.mockResolvedValue({
        id: 'doc-1',
        originalFileName: 'cnic.pdf',
        resident: { userId: 'user-resident-1' },
      });
      mockPrisma.residentDocument.update.mockResolvedValue({
        id: 'doc-1',
        verificationStatus: 'VERIFIED',
      });

      const res = await docService.reviewDocument(
        'soc-1',
        'doc-1',
        'admin-1',
        'VERIFIED',
      );
      expect(res.verificationStatus).toBe('VERIFIED');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RESIDENT_DOCUMENT_VERIFIED' }),
      );
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });
  });

  describe('ResidentRequestsService', () => {
    it('creates a request and records audit events', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue({
        id: 'res-1',
        societyId: 'soc-1',
      });
      mockPrisma.residentRequest.create.mockResolvedValue({
        id: 'req-1',
        requestNumber: 'REQ-2026-ABCD',
        title: 'Need NOC',
        status: 'SUBMITTED',
      });

      const res = await reqService.createRequest('soc-1', 'res-1', 'user-1', {
        requestType: 'RESIDENCE_CERTIFICATE' as any,
        title: 'Need NOC',
      });

      expect(res.id).toBe('req-1');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REQUEST_CREATED' }),
      );
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REQUEST_SUBMITTED' }),
      );
    });

    it('enforces resident ownership when fetching request by ID', async () => {
      mockPrisma.residentRequest.findFirst.mockResolvedValue(null);
      await expect(
        reqService.getResidentRequestById('soc-1', 'res-1', 'req-999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('cancels submitted request', async () => {
      mockPrisma.residentRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        requestNumber: 'REQ-1',
        status: 'SUBMITTED',
      });
      mockPrisma.residentRequest.update.mockResolvedValue({
        id: 'req-1',
        status: 'CANCELLED',
      });

      const res = await reqService.cancelRequest(
        'soc-1',
        'res-1',
        'user-1',
        'req-1',
      );
      expect(res.status).toBe('CANCELLED');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REQUEST_CANCELLED' }),
      );
    });
  });

  describe('MoveInOutService', () => {
    it('creates move-in request for valid property & unit', async () => {
      mockPrisma.property.findFirst.mockResolvedValue({ id: 'prop-1' });
      mockPrisma.unit.findFirst.mockResolvedValue({ id: 'unit-1' });
      mockPrisma.moveInRequest.create.mockResolvedValue({
        id: 'mov-1',
        requestNumber: 'MOV-IN-2026-1234',
        status: 'SUBMITTED',
      });

      const res = await moveService.createMoveInRequest(
        'soc-1',
        'res-1',
        'user-1',
        {
          propertyId: 'prop-1',
          unitId: 'unit-1',
          occupancyType: 'TENANT' as any,
          desiredMoveInDate: '2026-09-01',
        },
      );

      expect(res.id).toBe('mov-1');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MOVE_IN_REQUEST_CREATED' }),
      );
    });

    it('completes move-in within a transaction', async () => {
      mockPrisma.moveInRequest.findFirst.mockResolvedValue({
        id: 'mov-1',
        societyId: 'soc-1',
        residentId: 'res-1',
        unitId: 'unit-1',
        occupancyType: 'TENANT',
        desiredMoveInDate: new Date('2026-09-01'),
        status: 'APPROVED',
      });
      mockPrisma.residentOccupancy.findFirst.mockResolvedValue(null);
      mockPrisma.moveInRequest.update.mockResolvedValue({
        id: 'mov-1',
        status: 'COMPLETED',
      });

      const res = await moveService.completeMoveIn('soc-1', 'mov-1', 'admin-1');
      expect(res.status).toBe('COMPLETED');
      expect(mockPrisma.residentOccupancy.create).toHaveBeenCalled();
      expect(mockPrisma.resident.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'ACTIVE' },
      });
    });

    it('rejects move-in completion if another active primary occupant exists', async () => {
      mockPrisma.moveInRequest.findFirst.mockResolvedValue({
        id: 'mov-1',
        societyId: 'soc-1',
        residentId: 'res-1',
        unitId: 'unit-1',
        occupancyType: 'TENANT',
        desiredMoveInDate: new Date('2026-09-01'),
        status: 'APPROVED',
      });
      mockPrisma.residentOccupancy.findFirst.mockResolvedValue({
        id: 'occ-existing',
        residentId: 'res-other',
        unitId: 'unit-1',
      });

      await expect(
        moveService.completeMoveIn('soc-1', 'mov-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('completes move-out and closes active occupancy & permits', async () => {
      mockPrisma.moveOutRequest.findFirst.mockResolvedValue({
        id: 'mout-1',
        societyId: 'soc-1',
        residentId: 'res-1',
        unitId: 'unit-1',
        desiredMoveOutDate: new Date('2026-09-30'),
        status: 'APPROVED',
      });
      mockPrisma.monthlyDue.findMany.mockResolvedValue([]);
      mockPrisma.moveOutRequest.update.mockResolvedValue({
        id: 'mout-1',
        status: 'COMPLETED',
      });

      const res = await moveService.completeMoveOut(
        'soc-1',
        'mout-1',
        'admin-1',
      );
      expect(res.status).toBe('COMPLETED');
      expect(mockPrisma.residentOccupancy.updateMany).toHaveBeenCalled();
      expect(mockPrisma.parkingPermit.updateMany).toHaveBeenCalled();
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MOVE_OUT_COMPLETED' }),
      );
    });

    it('rejects move-out completion if resident has unpaid dues', async () => {
      mockPrisma.moveOutRequest.findFirst.mockResolvedValue({
        id: 'mout-1',
        societyId: 'soc-1',
        residentId: 'res-1',
        unitId: 'unit-1',
        duesClearanceStatus: 'PENDING',
        status: 'APPROVED',
      });
      mockPrisma.monthlyDue.findMany.mockResolvedValue([
        { id: 'due-1', status: 'PENDING' },
      ]);

      await expect(
        moveService.completeMoveOut('soc-1', 'mout-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('CommunityService', () => {
    it('validates event start and end times', async () => {
      await expect(
        comService.createEvent('soc-1', 'user-1', {
          title: 'Meeting',
          eventType: 'SOCIETY_MEETING' as any,
          startsAt: '2026-09-01T14:00:00Z',
          endsAt: '2026-09-01T13:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates community event and records audit', async () => {
      mockPrisma.communityEvent.create.mockResolvedValue({
        id: 'evt-1',
        title: 'Meeting',
        status: 'SCHEDULED',
      });

      const res = await comService.createEvent('soc-1', 'user-1', {
        title: 'Meeting',
        eventType: 'SOCIETY_MEETING' as any,
        startsAt: '2026-09-01T14:00:00Z',
        endsAt: '2026-09-01T15:00:00Z',
      });

      expect(res.id).toBe('evt-1');
      expect(mockAudit.recordSafely).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COMMUNITY_EVENT_CREATED' }),
      );
    });

    it('manages emergency contacts', async () => {
      mockPrisma.emergencyContact.create.mockResolvedValue({
        id: 'em-1',
        name: 'Gate 1',
        category: 'Security',
        phone: '03001234567',
      });

      const res = await comService.createEmergencyContact('soc-1', {
        name: 'Gate 1',
        category: 'Security',
        phone: '03001234567',
      });

      expect(res.id).toBe('em-1');
    });
  });
});

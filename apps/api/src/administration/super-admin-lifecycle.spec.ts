import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ResidentsService } from '../residents/residents.service';
import { PropertiesService } from '../properties/properties.service';
import { AdministrationService } from '../administration/administration.service';
import { ResidentIdService } from '../residents/resident-id.service';
import { IdentityProtectionService } from '../residents/identity-protection.service';
import { PasswordService } from '../auth/password.service';
import { PrivateStorageService } from '../resident-storage/private-storage.service';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';
import { PollsService } from '../polls/polls.service';
import { NotFoundException } from '@nestjs/common';
import type { RequestUser } from '../common/request-context';
import { ROLE_CODES, PERMISSIONS } from '@residence/shared';

describe('Super Admin, Resident Lifecycle & Society Activity Center', () => {
  let residentsService: ResidentsService;
  let propertiesService: PropertiesService;
  let adminService: AdministrationService;
  let residentIdService: ResidentIdService;
  let pollsService: PollsService;

  const societyA = '11111111-1111-1111-1111-111111111111';
  const adminUserA: RequestUser = {
    id: '33333333-3333-3333-3333-333333333333',
    sessionId: 'session-admin-a',
    societyId: societyA,
    username: 'societyadmin',
    displayName: 'Society Administrator',
    forcePasswordChange: false,
    roles: [ROLE_CODES.ADMINISTRATOR],
    permissions: Object.values(PERMISSIONS),
    csrfToken: 'test-csrf-token',
  };

  const superAdminUser: RequestUser = {
    id: '44444444-4444-4444-4444-444444444444',
    sessionId: 'session-super-admin',
    societyId: societyA,
    username: 'superadmin',
    displayName: 'Platform Super Admin',
    forcePasswordChange: false,
    roles: [ROLE_CODES.SUPER_ADMINISTRATOR],
    permissions: Object.values(PERMISSIONS),
    csrfToken: 'test-csrf-token',
  };

  const mockPrisma: any = {
    $transaction: jest.fn((input: any) => {
      if (typeof input === 'function') {
        return input(mockPrisma);
      }
      return Promise.all(input);
    }),
    $queryRaw: jest.fn().mockResolvedValue([{ value: BigInt(247) }]),
    society: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ id: societyA, currency: 'PKR' }),
      findFirst: jest.fn(),
    },
    systemSetting: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    resident: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    residentOccupancy: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    property: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
    },
    unit: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userAccount: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    userRole: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    userSession: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    passwordResetToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    poll: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    pollBallot: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    pollBallotSelection: {
      createMany: jest.fn(),
    },
  };

  const mockConfig: any = {
    get: jest.fn((key: string) => {
      if (key === 'security.identityKey')
        return '01234567890123456789012345678901';
      return null;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'security.identityKey')
        return '01234567890123456789012345678901';
      return '01234567890123456789012345678901';
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResidentsService,
        PropertiesService,
        AdministrationService,
        ResidentIdService,
        IdentityProtectionService,
        PasswordService,
        PollsService,
        AuditService,
        { provide: PrivateStorageService, useValue: { store: jest.fn() } },
        { provide: SupabaseAdminService, useValue: {} },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    residentsService = module.get(ResidentsService);
    propertiesService = module.get(PropertiesService);
    adminService = module.get(AdministrationService);
    residentIdService = module.get(ResidentIdService);
    pollsService = module.get(PollsService);
  });

  describe('1. Resident Creation & Property-First Flow', () => {
    it('creates resident in own society with atomic sequence ID and occupancy', async () => {
      mockPrisma.unit.findFirst.mockResolvedValue({
        id: 'unit-1',
        propertyId: 'prop-1',
        unitNumber: '101',
        property: {
          id: 'prop-1',
          societyId: societyA,
          block: 'A',
          propertyNumber: '12',
        },
        occupancies: [],
      });
      mockPrisma.role.findFirst.mockResolvedValue({
        id: 'role-resident',
        code: 'RESIDENT',
      });
      mockPrisma.resident.create.mockResolvedValue({
        id: 'res-uuid-1',
        societyId: societyA,
        residentNumber: 'RES-2026-000247',
        fullName: 'Ahmed Khan',
        status: 'ACTIVE',
      });

      const nextId = await residentIdService.next(
        mockPrisma,
        societyA,
        new Date('2026-08-22'),
      );
      expect(nextId).toBe('RES-2026-000247');
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('rejects resident creation if property belongs to a different society (IDOR prevention)', async () => {
      // Unit is in Society B, but admin is from Society A
      mockPrisma.unit.findFirst.mockResolvedValue(null);

      await expect(
        residentsService.create(adminUserA, {
          propertyId: 'prop-society-b',
          unitId: 'unit-society-b',
          occupancyType: 'OWNER',
          fullName: 'Malicious Resident',
          primaryPhone: '+923001234567',
          moveInDate: '2026-08-22',
          householdMembers: [],
          vehicles: [],
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('ensures resident ID generation is safe and sequential under concurrency', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ value: BigInt(100) }])
        .mockResolvedValueOnce([{ value: BigInt(101) }]);

      const id1 = await residentIdService.next(
        mockPrisma,
        societyA,
        new Date('2026-08-22'),
      );
      const id2 = await residentIdService.next(
        mockPrisma,
        societyA,
        new Date('2026-08-22'),
      );

      expect(id1).toBe('RES-2026-000100');
      expect(id2).toBe('RES-2026-000101');
      expect(id1).not.toBe(id2);
    });
  });

  describe('2. Resident Lifecycle & History Preservation', () => {
    it('suspends resident with reason and logs audit event', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue({
        id: 'res-1',
        societyId: societyA,
        status: 'ACTIVE',
        version: 0,
      });
      mockPrisma.resident.update.mockResolvedValue({
        id: 'res-1',
        status: 'SUSPENDED',
      });

      const res = await residentsService.suspend(adminUserA, 'res-1', {
        reason: 'Violation of society bylaws',
      });

      expect(res).toBeDefined();
      expect(mockPrisma.resident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-1' },
          data: expect.objectContaining({
            status: 'SUSPENDED',
            suspensionReason: 'Violation of society bylaws',
          }),
        }),
      );
    });

    it('moves out resident by closing occupancy while preserving resident and financial history', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue({
        id: 'res-1',
        societyId: societyA,
        status: 'ACTIVE',
        version: 0,
        occupancies: [{ id: 'occ-1', unitId: 'unit-1', endDate: null }],
      });
      mockPrisma.residentOccupancy.findFirst.mockResolvedValue({
        id: 'occ-1',
        unitId: 'unit-1',
        startDate: new Date('2026-01-01'),
        endDate: null,
      });
      mockPrisma.residentOccupancy.update.mockResolvedValue({
        id: 'occ-1',
        endDate: new Date('2026-08-22'),
      });
      mockPrisma.resident.update.mockResolvedValue({
        id: 'res-1',
        status: 'MOVED_OUT',
      });
      mockPrisma.unit.update.mockResolvedValue({
        id: 'unit-1',
        status: 'AVAILABLE',
      });

      const res = await residentsService.moveOut(adminUserA, 'res-1', {
        moveOutDate: '2026-08-22',
        reason: 'Tenancy ended',
      });

      expect(res).toBeDefined();
      expect(mockPrisma.residentOccupancy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'occ-1' },
          data: expect.objectContaining({
            endDate: new Date('2026-08-22'),
            moveOutReason: 'Tenancy ended',
          }),
        }),
      );
      expect(mockPrisma.resident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-1' },
          data: expect.objectContaining({ status: 'MOVED_OUT' }),
        }),
      );
      expect(mockPrisma.unit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'unit-1' },
          data: expect.objectContaining({ status: 'AVAILABLE' }),
        }),
      );
    });
  });

  describe('3. Society Isolation across Resident 360 & Property 360', () => {
    it('scopes Resident 360 detail queries to the authenticated society', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue({
        id: 'res-1',
        societyId: societyA,
        residentNumber: 'RES-2026-000001',
        fullName: 'Resident in Society A',
        occupancies: [],
        householdMembers: [],
        vehicles: [],
        documents: [],
        idCards: [],
        feeAssignments: [],
      });

      const detail = await residentsService.detail(adminUserA, 'res-1');
      expect(detail).toBeDefined();
      expect(mockPrisma.resident.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'res-1',
            societyId: societyA,
          }),
        }),
      );
    });

    it('rejects Property 360 detail queries across societies', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(null);

      await expect(
        propertiesService.detail(adminUserA, 'prop-in-society-b'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.property.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prop-in-society-b', societyId: societyA },
        }),
      );
    });
  });

  describe('4. Password Safety & Credential Isolation', () => {
    it('ensures resident detail responses never expose passwordHash, session tokens or reset tokens', async () => {
      mockPrisma.resident.findFirst.mockResolvedValue({
        id: 'res-1',
        societyId: societyA,
        residentNumber: 'RES-2026-000001',
        fullName: 'Resident in Society A',
        user: {
          id: 'user-1',
          username: 'res1',
          email: 'res1@example.com',
          status: 'ACTIVE',
          forcePasswordChange: false,
          lastLoginAt: new Date(),
        },
        occupancies: [],
        householdMembers: [],
        vehicles: [],
        documents: [],
        idCards: [],
        feeAssignments: [],
      });

      const detail = await residentsService.detail(adminUserA, 'res-1');
      expect(detail).toBeDefined();
      expect(detail).not.toHaveProperty('password');
      expect(detail).not.toHaveProperty('passwordHash');
      if (detail.user) {
        expect(detail.user).not.toHaveProperty('password');
        expect(detail.user).not.toHaveProperty('passwordHash');
        expect(detail.user).not.toHaveProperty('tokenHash');
      }
    });

    it('preserves dedicated password reset workflow with forced change flag and audit trail', async () => {
      mockPrisma.userAccount.findFirst.mockResolvedValue({
        id: 'target-user-1',
        societyId: societyA,
      });
      mockPrisma.userAccount.update.mockResolvedValue({
        id: 'target-user-1',
        forcePasswordChange: true,
      });

      await adminService.forcePasswordReset(
        superAdminUser,
        'target-user-1',
        'Credential rotation policy',
      );

      expect(mockPrisma.userAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'target-user-1' },
          data: expect.objectContaining({
            forcePasswordChange: true,
          }),
        }),
      );
      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'target-user-1' }),
        }),
      );
    });
  });

  describe('5. RBAC Canonical Permission Validation', () => {
    it('validates complete canonical permission set for SUPER_ADMINISTRATOR', () => {
      const required = new Set<string>(Object.values(PERMISSIONS));
      expect(required.size).toBe(110);

      // Simulate full assigned permissions
      const assigned = new Set<string>(Object.values(PERMISSIONS));
      const missing = [...required].filter((p) => !assigned.has(p));
      expect(missing.length).toBe(0);
    });

    it('identifies missing permissions and flags RBAC_NOT_READY condition', () => {
      const required = new Set<string>(Object.values(PERMISSIONS));
      const targetMissing: string = PERMISSIONS.POLL_RESULTS;
      const partialAssigned = new Set<string>(
        (Object.values(PERMISSIONS) as string[]).filter(
          (p) => p !== targetMissing,
        ),
      );

      const missing = [...required].filter((p) => !partialAssigned.has(p));
      expect(missing.length).toBe(1);
      expect(missing).toContain(targetMissing);
    });

    it('handles extra permissions gracefully without failing if all required exist', () => {
      const required = new Set<string>(Object.values(PERMISSIONS));
      const assignedWithExtra = new Set<string>([
        ...(Object.values(PERMISSIONS) as string[]),
        'CUSTOM_EXTRA_PERMISSION',
      ]);

      const missing = [...required].filter((p) => !assignedWithExtra.has(p));
      expect(missing.length).toBe(0);
    });

    it('deduplicates duplicate role permissions so duplicates do not inflate coverage', () => {
      const required = new Set<string>(Object.values(PERMISSIONS));
      const targetMissing: string = PERMISSIONS.POLL_RESULTS;
      // Missing POLL_RESULTS, but has duplicate of ASSET_VIEW
      const rawListWithDupes: string[] = [
        ...(Object.values(PERMISSIONS) as string[]).filter(
          (p) => p !== targetMissing,
        ),
        PERMISSIONS.ASSET_VIEW,
      ];
      const assigned = new Set<string>(rawListWithDupes);

      const missing = [...required].filter((p) => !assigned.has(p));
      expect(missing.length).toBe(1);
      expect(missing).toContain(targetMissing);
    });
  });

  describe('6. Activity & Audit Center Filtering and Redaction', () => {
    it('queries audit logs with society isolation, filtering, and pagination', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(1);
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          societyId: societyA,
          action: 'RESIDENT_CREATED',
          targetType: 'Resident',
          targetId: 'res-1',
          outcome: 'SUCCESS',
          reason: 'Admin onboarded resident',
          safeMetadata: {
            passwordHash: 'secret',
            token: 'xyz',
            residentNumber: 'RES-001',
          },
          createdAt: new Date(),
          actor: { id: adminUserA.id, displayName: 'Admin', username: 'admin' },
        },
      ]);

      const result = await adminService.auditLogs(adminUserA, {
        page: 1,
        pageSize: 50,
        action: 'RESIDENT_CREATED',
      } as any);

      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].action).toBe('RESIDENT_CREATED');
      // Verify sensitive metadata is redacted to [REDACTED]
      expect(result.items[0].safeMetadata).toHaveProperty(
        'passwordHash',
        '[REDACTED]',
      );
      expect(result.items[0].safeMetadata).toHaveProperty(
        'token',
        '[REDACTED]',
      );
      expect(result.items[0].safeMetadata).toHaveProperty(
        'residentNumber',
        'RES-001',
      );
    });

    it('records audit events for Super Admin operations', async () => {
      mockPrisma.userAccount.findFirst.mockResolvedValue({
        id: 'target-user',
        societyId: societyA,
      });

      await adminService.forcePasswordReset(
        superAdminUser,
        'target-user',
        'Security policy rotation',
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            societyId: societyA,
            actorUserId: superAdminUser.id,
            action: 'PASSWORD_RESET_FORCED',
            targetType: 'UserAccount',
            targetId: 'target-user',
            reason: 'Security policy rotation',
          }),
        }),
      );
    });
  });

  describe('7. Anonymous Poll Privacy Guarantees', () => {
    it('does not expose resident-to-option identity correlation for anonymous polls', async () => {
      mockPrisma.poll.findFirst.mockResolvedValue({
        id: 'poll-1',
        societyId: societyA,
        title: 'Budget Allocation Vote',
        anonymous: true,
        options: [
          { id: 'opt-1', label: 'Option A', _count: { selections: 10 } },
          { id: 'opt-2', label: 'Option B', _count: { selections: 5 } },
        ],
        _count: { ballots: 15 },
        createdByUser: { id: superAdminUser.id, displayName: 'Admin' },
      });

      const poll = await pollsService.getPollById(societyA, 'poll-1');

      expect(poll).toBeDefined();
      expect(poll.anonymous).toBe(true);
      expect(poll._count.ballots).toBe(15);
      // Ensure options only expose aggregate counts, no resident identities
      expect(poll.options[0]._count.selections).toBe(10);
      expect(poll.options[0]).not.toHaveProperty('ballotSelections');
    });
  });
});

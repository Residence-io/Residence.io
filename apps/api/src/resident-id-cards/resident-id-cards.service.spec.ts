import { ResidentIDCardsService } from './resident-id-cards.service';

const resident = {
  id: '14e6b1c0-1b6b-4a46-8808-c675dcf62058',
  societyId: '24e6b1c0-1b6b-4a46-8808-c675dcf62058',
  userId: '34e6b1c0-1b6b-4a46-8808-c675dcf62058',
  residentNumber: 'RES-2026-000001',
  fullName: 'Safe Resident',
  status: 'ACTIVE',
  society: { name: 'Test Society' },
  occupancies: [
    {
      occupancyType: 'OWNER',
      unit: { unitNumber: 'A-12', property: { block: 'A' } },
    },
  ],
};
const actor = {
  id: '44e6b1c0-1b6b-4a46-8808-c675dcf62058',
  societyId: resident.societyId,
  username: 'admin',
  displayName: 'Admin',
  forcePasswordChange: false,
  roles: ['ADMINISTRATOR'],
  permissions: ['RESIDENT_ID_CARD_MANAGE', 'RESIDENT_READ'],
  csrfToken: 'csrf',
  sessionId: 'session',
};

describe('ResidentIDCardsService', () => {
  it('generates a real PDF and stores only an opaque verification hash', async () => {
    let pdf: Buffer | undefined;
    let createdData: Record<string, unknown> | undefined;
    const tx = {
      residentIDCard: {
        updateMany: jest.fn(),
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) => {
            createdData = data;
            return { id: 'card', ...data, status: 'ACTIVE' };
          }),
      },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      resident: { findFirst: jest.fn().mockResolvedValue(resident) },
      $transaction: jest
        .fn()
        .mockImplementation((callback: (value: typeof tx) => unknown) =>
          callback(tx),
        ),
    };
    const storage = {
      store: jest.fn().mockImplementation((_id: string, buffer: Buffer) => {
        pdf = buffer;
        return {
          objectKey: `${resident.id}/54e6b1c0-1b6b-4a46-8808-c675dcf62058.pdf`,
        };
      }),
      remove: jest.fn(),
    };
    const service = new ResidentIDCardsService(
      prisma as never,
      storage as never,
      { getOrThrow: () => 'http://localhost:3000' } as never,
    );
    await service.generate(actor, resident.id);
    expect(pdf?.subarray(0, 5).toString()).toBe('%PDF-');
    expect(createdData?.verificationHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(createdData)).not.toContain('Safe Resident');
  });

  it('returns only safe verification fields and invalidates revoked cards', async () => {
    const prisma = {
      residentIDCard: {
        findUnique: jest.fn().mockResolvedValue({
          status: 'REVOKED',
          expiresAt: new Date('2030-01-01'),
          resident,
        }),
      },
    };
    const service = new ResidentIDCardsService(
      prisma as never,
      {} as never,
      { getOrThrow: () => 'http://localhost:3000' } as never,
    );
    const result = await service.verify('a'.repeat(43));
    expect(result.valid).toBe(false);
    expect(result).toMatchObject({
      residentName: 'Safe Resident',
      residentNumber: 'RES-2026-000001',
      societyName: 'Test Society',
    });
    expect(result).not.toHaveProperty('identityDocumentNumber');
    expect(result).not.toHaveProperty('primaryPhone');
  });
});

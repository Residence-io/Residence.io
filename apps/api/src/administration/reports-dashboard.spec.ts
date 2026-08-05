import { ReportsService } from './reports.service';

const actor = {
  id: '11111111-1111-4111-8111-111111111111',
  societyId: '22222222-2222-4222-8222-222222222222',
  username: 'resident',
  roles: ['RESIDENT'],
  permissions: [],
};

function prismaMock() {
  return {
    society: {
      findUnique: jest.fn().mockResolvedValue({
        name: 'Demo Society',
        currency: 'PKR',
        timeZone: 'Asia/Karachi',
      }),
    },
    resident: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ id: 'resident-1', fullName: 'Demo Resident' }),
    },
    payment: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    monthlyDue: {
      aggregate: jest.fn().mockResolvedValue({
        _sum: { totalAmount: null, paidAmount: null, waivedAmount: null },
      }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    residentCreditBalance: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    receipt: { findFirst: jest.fn().mockResolvedValue(null) },
    complaint: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    maintenanceRequest: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    notificationRecipient: { count: jest.fn().mockResolvedValue(0) },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
}

describe('dashboard aggregation boundaries', () => {
  it('scopes resident dashboard aggregates and chart queries to the authenticated resident', async () => {
    const prisma = prismaMock();
    const service = new ReportsService(prisma as never);

    const result = await service.residentDashboard(actor as never, {
      period: '6m',
    });

    expect(prisma.resident.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { societyId: actor.societyId, userId: actor.id },
      }),
    );
    expect(JSON.stringify(prisma.payment.aggregate.mock.calls)).toContain(
      '"residentId":"resident-1"',
    );
    expect(prisma.complaint.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { residentId: 'resident-1' },
      }),
    );
    expect(JSON.stringify(prisma.$queryRaw.mock.calls)).toContain('resident-1');
    expect(result.context.residentName).toBe('Demo Resident');
    expect(result).not.toHaveProperty('recentPayments');
  });
});

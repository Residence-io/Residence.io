import { Prisma } from '../generated/prisma/client';
import { SalarySlipService } from './salary-slip.service';

describe('salary-slip PDF', () => {
  it('renders a server-generated PDF', async () => {
    const service = new SalarySlipService(
      {} as never,
      {} as never,
      {} as never,
    );
    const decimal = (value: string) => new Prisma.Decimal(value);
    const bytes = await service.render(
      {
        staff: {
          society: { name: 'Residence Demo' },
          fullName: 'Demo Staff',
          staffNumber: 'STF-2026-000001',
          employments: [],
        },
        salaryPeriod: { year: 2026, month: 7 },
        basicSalary: decimal('1000'),
        allowances: decimal('100'),
        deductions: decimal('25'),
        adjustmentTotal: decimal('0'),
        netPayable: decimal('1075'),
        amountPaid: decimal('1075'),
        currency: 'PKR',
        payments: [],
      },
      'SAL-2026-000001',
      'http://localhost/verify/salary-slip/token',
    );
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  });
});

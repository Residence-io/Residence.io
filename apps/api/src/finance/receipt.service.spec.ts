import { PDFDocument } from 'pdf-lib';
import { Prisma } from '../generated/prisma/client';
import { ReceiptService } from './receipt.service';
describe('receipt PDF', () => {
  it('renders a server-generated PDF with payment data', async () => {
    const service = new ReceiptService({} as never, {} as never, {} as never);
    const payment = {
      society: { name: 'Residence Demo' },
      resident: {
        fullName: 'Demo Resident',
        residentNumber: 'RES-2026-1',
        occupancies: [],
        creditBalance: null,
        monthlyDues: [],
      },
      paymentDate: new Date('2026-01-02'),
      method: 'CASH',
      transactionReference: 'TX-1',
      id: 'payment-1',
      currency: 'PKR',
      amount: new Prisma.Decimal('100.00'),
      allocations: [],
    };
    const bytes = await service.render(
      payment,
      'RCT-2026-000001',
      'http://localhost/verify/receipt/token',
    );
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-');
  });
});

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import type { FinanceDashboard } from '@/lib/finance-types';
export const metadata = { title: 'Payments' };
export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  const query = await searchParams;
  const [dashboard, paymentPage] = await Promise.all([
    serverApi<FinanceDashboard>('/finance/dashboard'),
    serverApi<any>('/payments?pageSize=100'),
  ]);
  const payments = paymentPage;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Finance"
        title="Payments and resident balances"
        description="Confirmed payments, pending verification, dues, receipts, and immutable ledger postings."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Received', `${dashboard.currency} ${dashboard.totalReceived}`],
          ['Outstanding', `${dashboard.currency} ${dashboard.outstanding}`],
          ['Overdue dues', dashboard.overdueDues],
          ['Pending verification', dashboard.pendingVerification],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex flex-wrap gap-4">
          <Link className="font-semibold text-blue-700" href="/admin/payments">
            All payments
          </Link>
          <Link className="font-semibold text-blue-700" href="/admin/dues">
            Dues
          </Link>
          <Link className="font-semibold text-blue-700" href="/admin/dues/generate">
            Generate dues
          </Link>
          <Link className="font-semibold text-blue-700" href="/admin/fee-plans">
            Fee plans
          </Link>
          <Link className="font-semibold text-blue-700" href="/admin/payments/verification">
            Verification queue
          </Link>
          <Link className="font-semibold text-blue-700" href="/admin/reports/financial">
            Ledger & Reports
          </Link>
        </div>
      </Card>
    </div>
  );
}

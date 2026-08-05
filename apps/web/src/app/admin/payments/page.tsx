import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PaymentForm } from '@/components/finance/finance-actions';
import { getCurrentUser } from '@/lib/api.server';
import {
  fetchFinanceDashboard,
  fetchPayments,
} from '@/lib/supabase-data.server';
import type { FinanceDashboard, PaymentDetail } from '@/lib/finance-types';
export const metadata = { title: 'Payments' };
export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  const query = await searchParams;
  const [dashboard, items] = await Promise.all([
    fetchFinanceDashboard(),
    fetchPayments(),
  ]);
  const payments = { items: items as any, total: items.length };
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
          <Link className="font-semibold text-blue-700" href="/admin/fee-plans">
            Fee plans
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/dues/generate"
          >
            Generate dues
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/payments/verification"
          >
            Verification queue
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/reports/financial"
          >
            Financial reports
          </Link>
        </div>
      </Card>
      {user?.permissions.includes('PAYMENT_RECORD') && (
        <Card>
          <h2 className="mb-4 font-bold">Record administrative payment</h2>
          <PaymentForm csrfToken={user.csrfToken} />
        </Card>
      )}
      <Card>
        <h2 className="font-bold">Transactions ({payments.total})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="py-2">Resident</th>
                <th>Status</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.items.map((payment: any) => (
                <tr className="border-t" key={payment.id}>
                  <td className="py-3">
                    <Link
                      className="font-semibold text-blue-700"
                      href={`/admin/payments/transactions/${payment.id}`}
                    >
                      {payment.resident?.residentNumber} —{' '}
                      {payment.resident?.fullName}
                    </Link>
                  </td>
                  <td>{payment.status}</td>
                  <td>{payment.method.replaceAll('_', ' ')}</td>
                  <td>
                    {payment.currency} {payment.amount}
                  </td>
                  <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td>{payment.receipt?.receiptNumber ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

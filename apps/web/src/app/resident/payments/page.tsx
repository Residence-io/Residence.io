import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { FinanceDashboard, LedgerResponse } from '@/lib/finance-types';
export default async function ResidentPaymentsPage() {
  const [dashboard, ledger] = await Promise.all([
    serverApi<FinanceDashboard>('/finance/dashboard/me'),
    serverApi<LedgerResponse>('/finance/ledger/me?pageSize=8'),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="My payments"
        title={`${dashboard.currency} ${dashboard.outstanding} outstanding`}
        description="Review dues, advance credit, payments, and receipts linked only to your resident account."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total paid</p>
          <p className="text-2xl font-bold">
            {dashboard.currency} {dashboard.totalReceived}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Advance credit</p>
          <p className="text-2xl font-bold">
            {dashboard.currency} {ledger.advanceCredit}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Next due</p>
          <p className="text-xl font-bold">
            {dashboard.nextDueDate
              ? new Date(dashboard.nextDueDate).toLocaleDateString()
              : 'None'}
          </p>
        </Card>
      </div>
      <Card>
        <div className="flex gap-4">
          <Link
            className="font-semibold text-blue-700"
            href="/resident/payments/pay"
          >
            Make payment
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/resident/payments/history"
          >
            Payment history
          </Link>
        </div>
      </Card>
    </div>
  );
}

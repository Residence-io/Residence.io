import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import type { FinanceDashboard } from '@/lib/finance-types';

export const metadata = { title: 'Finance' };

export default async function FinanceOverviewPage() {
  await getCurrentUser();
  const dashboard = await serverApi<FinanceDashboard>(
    '/finance/dashboard',
  ).catch(() => ({
    currency: 'PKR',
    totalReceived: '0.00',
    outstanding: '0.00',
    overdueDues: 0,
    pendingVerification: 0,
  }));

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Finance & Accounts"
        title="Financial Overview & Management"
        description="Single source of financial truth: Resident billing, collections, expenses, vendors, budgets, and bank reconciliation."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            'Total Collections',
            `${dashboard.currency} ${dashboard.totalReceived}`,
          ],
          [
            'Outstanding Receivables',
            `${dashboard.currency} ${dashboard.outstanding}`,
          ],
          ['Overdue Dues', dashboard.overdueDues],
          ['Transfers Awaiting Verification', dashboard.pendingVerification],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-3">
          Finance Modules & Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Link
            className="p-3 bg-slate-50 hover:bg-blue-50 rounded font-medium text-blue-700 border border-slate-200"
            href="/admin/finance/expenses"
          >
            💸 Expenses & Approvals
          </Link>
          <Link
            className="p-3 bg-slate-50 hover:bg-blue-50 rounded font-medium text-blue-700 border border-slate-200"
            href="/admin/finance/vendors"
          >
            🏢 Vendor Directory
          </Link>
          <Link
            className="p-3 bg-slate-50 hover:bg-blue-50 rounded font-medium text-blue-700 border border-slate-200"
            href="/admin/finance/budgets"
          >
            📊 Budget Management
          </Link>
          <Link
            className="p-3 bg-slate-50 hover:bg-blue-50 rounded font-medium text-blue-700 border border-slate-200"
            href="/admin/finance/banking"
          >
            🏦 Society Bank Accounts
          </Link>
          <Link
            className="p-3 bg-slate-50 hover:bg-blue-50 rounded font-medium text-blue-700 border border-slate-200"
            href="/admin/finance/reconciliation"
          >
            ⚖️ Bank Reconciliation
          </Link>
          <Link
            className="p-3 bg-slate-50 hover:bg-blue-50 rounded font-medium text-blue-700 border border-slate-200"
            href="/admin/payments/verification"
          >
            ✅ Transfer Verification
          </Link>
          <Link
            className="p-3 bg-slate-50 hover:bg-blue-50 rounded font-medium text-blue-700 border border-slate-200"
            href="/admin/payments"
          >
            💳 Resident Payments
          </Link>
          <Link
            className="p-3 bg-slate-50 hover:bg-blue-50 rounded font-medium text-blue-700 border border-slate-200"
            href="/admin/reports/financial"
          >
            📈 Ledger & Reports
          </Link>
        </div>
      </Card>
    </div>
  );
}

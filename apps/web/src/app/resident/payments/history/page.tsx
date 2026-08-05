import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { LedgerResponse } from '@/lib/finance-types';
export default async function PaymentHistoryPage() {
  const ledger = await serverApi<LedgerResponse>(
    '/finance/ledger/me?pageSize=100',
  );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="My payments"
        title="Ledger history"
        description="A chronological record of charges, credits, adjustments, reversals, and refunds."
      />
      <Card>
        <ul className="divide-y">
          {ledger.items.map((entry) => (
            <li className="flex justify-between gap-4 py-3" key={entry.id}>
              <span>
                {new Date(entry.eventDate).toLocaleDateString()} ·{' '}
                {entry.description}
              </span>
              <strong>
                {entry.direction === 'DEBIT' ? '+' : '−'} {entry.currency}{' '}
                {entry.amount}
              </strong>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

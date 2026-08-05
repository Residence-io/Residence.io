import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { LedgerResponse } from '@/lib/finance-types';
export default async function ResidentLedgerPage({
  params,
}: {
  params: Promise<{ residentId: string }>;
}) {
  const { residentId } = await params;
  const ledger = await serverApi<LedgerResponse>(
    `/finance/ledger/${residentId}`,
  );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Resident finance"
        title="Resident ledger"
        description="Posted debits and credits are immutable; corrections use compensating entries."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-500">Closing balance</p>
          <p className="text-2xl font-bold">{ledger.balance}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Advance credit</p>
          <p className="text-2xl font-bold">{ledger.advanceCredit}</p>
        </Card>
      </div>
      <Card>
        <LedgerTable ledger={ledger} />
      </Card>
    </div>
  );
}
function LedgerTable({ ledger }: { ledger: LedgerResponse }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Debit/Credit</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {ledger.items.map((entry: any) => (
            <tr className="border-t" key={entry.id}>
              <td className="py-3">
                {new Date(entry.eventDate).toLocaleDateString()}
              </td>
              <td>{entry.type.replaceAll('_', ' ')}</td>
              <td>{entry.reference}</td>
              <td>{entry.direction}</td>
              <td>
                {entry.currency} {entry.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { FinancialSettingsForm } from '@/components/phase7/financial-settings-form';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
type Period = {
  id: string;
  defaultMonthlyFee: string;
  dueDay: number;
  currency: string;
  receiptPrefix: string;
  effectiveFrom: string;
  effectiveTo?: string;
  archivedAt?: string;
};
export default async function Page() {
  const [user, periods] = await Promise.all([
    getCurrentUser(),
    serverApi<Period[]>('/settings/financial'),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Effective-dated financial settings"
        description="New periods never rewrite historical dues, ledger entries, payments, or receipts."
      />
      <Card>
        <h2 className="mb-4 font-bold">Create financial settings period</h2>
        <FinancialSettingsForm csrfToken={user?.csrfToken ?? ''} />
      </Card>
      <div className="space-y-3">
        {periods.length ? (
          periods.map((period: any) => (
            <Card key={period.id}>
              <p className="font-bold">
                {period.currency} {period.defaultMonthlyFee} · due day{' '}
                {period.dueDay}
              </p>
              <p className="text-sm text-slate-600">
                {new Date(period.effectiveFrom).toLocaleDateString()} –{' '}
                {period.effectiveTo
                  ? new Date(period.effectiveTo).toLocaleDateString()
                  : 'ongoing'}{' '}
                · receipt prefix {period.receiptPrefix}
                {period.archivedAt ? ' · archived' : ''}
              </p>
            </Card>
          ))
        ) : (
          <EmptyState title="No financial settings periods">
            Create the first effective period above.
          </EmptyState>
        )}
      </div>
    </div>
  );
}

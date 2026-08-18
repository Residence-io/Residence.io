import { Card } from '@/components/ui/card';
import { FeePlanForm } from '@/components/finance/finance-actions';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser } from '@/lib/api.server';
import { serverApi } from '@/lib/api.server';
import type { FeePlan } from '@/lib/finance-types';
export default async function FeePlansPage() {
  const [user, plans] = await Promise.all([getCurrentUser(), serverApi<any[]>('/fee-plans')]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Billing configuration"
        title="Fee plans"
        description="Effective-dated plans preserve the fee snapshot used for every issued due."
      />
      {user?.permissions.includes('BILLING_FEE_MANAGE') && (
        <Card>
          <FeePlanForm csrfToken={user.csrfToken} />
        </Card>
      )}
      <div className="grid gap-4">
        {plans.map((plan: any) => (
          <Card key={plan.id}>
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold">{plan.name}</h2>
                <p className="text-sm text-slate-500">
                  {plan.scope.replaceAll('_', ' ')} · effective{' '}
                  {new Date(plan.effectiveFrom).toLocaleDateString()}
                </p>
              </div>
              <p className="text-xl font-bold">
                {plan.currency} {plan.monthlyBaseAmount}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

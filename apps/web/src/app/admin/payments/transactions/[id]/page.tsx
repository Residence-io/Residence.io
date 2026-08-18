import { serverApi } from '@/lib/api.server';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PaymentDecisionActions } from '@/components/finance/finance-actions';
import { API_URL } from '@/lib/api-client';
import { getCurrentUser } from '@/lib/api.server';
import type { PaymentDetail } from '@/lib/finance-types';
export default async function TransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, payment] = await Promise.all([
    getCurrentUser(),
    serverApi<any>(`/payments/${id}`),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Transaction"
        title={`${payment.currency} ${payment.amount}`}
        description={`${payment.resident.fullName} · ${payment.status}`}
      />
      <Card>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Method</dt>
            <dd>{payment.method.replaceAll('_', ' ')}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Reference</dt>
            <dd>{payment.transactionReference ?? payment.id}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Payment date</dt>
            <dd>{new Date(payment.paymentDate).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Receipt</dt>
            <dd>
              {payment.receipt ? (
                <Link
                  className="text-blue-700"
                  href={`${API_URL}/receipts/${payment.receipt.id}`}
                >
                  {payment.receipt.receiptNumber}
                </Link>
              ) : (
                'Not issued'
              )}
            </dd>
          </div>
        </dl>
      </Card>
      {user && (
        <Card>
          <PaymentDecisionActions
            csrfToken={user.csrfToken}
            paymentId={payment.id}
          />
        </Card>
      )}
    </div>
  );
}

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { PaymentDetail } from '@/lib/finance-types';
export default async function VerificationPage() {
  const payments = await serverApi<{ items: PaymentDetail[]; total: number }>(
    '/payments?status=PENDING_VERIFICATION&pageSize=100',
  );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Finance"
        title="Payment verification"
        description="Review private bank-transfer proofs before confirming ledger credit."
      />
      <Card>
        {payments.items.length ? (
          <ul className="divide-y">
            {payments.items.map((payment: any) => (
              <li className="flex justify-between py-3" key={payment.id}>
                <span>
                  {payment.resident.fullName} · {payment.currency}{' '}
                  {payment.amount}
                </span>
                <Link
                  className="font-semibold text-blue-700"
                  href={`/admin/payments/transactions/${payment.id}`}
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No payments are awaiting verification.</p>
        )}
      </Card>
    </div>
  );
}

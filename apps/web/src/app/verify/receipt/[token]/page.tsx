import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { API_URL } from '@/lib/api-client';
export default async function VerifyReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const response = await fetch(
    `${API_URL}/receipts/verify/${encodeURIComponent(token)}`,
    { cache: 'no-store' },
  );
  const result = response.ok
    ? ((await response.json()) as {
        valid: boolean;
        receiptNumber?: string;
        status?: string;
        amount?: string;
        currency?: string;
        issuedAt?: string;
      })
    : { valid: false };
  return (
    <main className="mx-auto max-w-2xl p-6">
      <PageHeader
        eyebrow="Public verification"
        title={result.valid ? 'Valid payment receipt' : 'Receipt is not valid'}
        description="This page intentionally reveals only safe receipt validity information."
      />
      <Card>
        <dl className="grid gap-3">
          <div>
            <dt className="text-sm text-slate-500">Receipt</dt>
            <dd>{result.receiptNumber ?? 'Not available'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Amount</dt>
            <dd>
              {result.valid
                ? `${result.currency} ${result.amount}`
                : 'Not available'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Status</dt>
            <dd>{result.status ?? 'INVALID'}</dd>
          </div>
        </dl>
      </Card>
    </main>
  );
}

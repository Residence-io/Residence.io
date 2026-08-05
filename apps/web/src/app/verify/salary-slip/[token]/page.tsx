import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
export default async function VerifySalarySlip({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await serverApi<{
    valid: boolean;
    slipNumber?: string;
    society?: string;
    staffName?: string;
    staffNumber?: string;
    period?: string;
    netSalary?: string;
    currency?: string;
    status?: string;
  }>(`/workforce/salary-slips/verify/${encodeURIComponent(token)}`);
  return (
    <div className="mx-auto max-w-2xl space-y-7 py-12">
      <PageHeader
        eyebrow="Verification"
        title={result.valid ? 'Valid salary slip' : 'Invalid salary slip'}
        description="This page exposes only safe verification information."
      />
      <Card>
        {result.valid ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Slip</dt>
              <dd>{result.slipNumber}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Society</dt>
              <dd>{result.society}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Staff</dt>
              <dd>
                {result.staffName} ({result.staffNumber})
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Period</dt>
              <dd>{result.period}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Net salary</dt>
              <dd>
                {result.currency} {result.netSalary}
              </dd>
            </div>
          </dl>
        ) : (
          <p>The verification reference is invalid or revoked.</p>
        )}
      </Card>
    </div>
  );
}

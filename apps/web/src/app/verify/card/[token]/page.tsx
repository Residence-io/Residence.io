import { serverApi } from '@/lib/api.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default async function VerifyCardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await serverApi<{
    valid: boolean;
    status?: string;
    residentName?: string;
    residentNumber?: string;
    societyName?: string;
    unit?: string;
    expiresAt?: string;
  }>(`/verify/card/${encodeURIComponent(token)}`);
  return (
    <main className="mx-auto max-w-xl p-6">
      <PageHeader
        eyebrow="Residence.io"
        title="Resident ID-card verification"
        description="This page displays only the minimum information required to validate the card."
      />
      <Card className="mt-6">
        <p
          className={`text-lg font-bold ${result.valid ? 'text-emerald-700' : 'text-red-700'}`}
        >
          {result.valid ? 'Valid card' : 'Invalid or revoked card'}
        </p>
        {result.residentName && (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <dt>Resident</dt>
            <dd>{result.residentName}</dd>
            <dt>Resident ID</dt>
            <dd>{result.residentNumber}</dd>
            <dt>Society</dt>
            <dd>{result.societyName}</dd>
            <dt>Unit</dt>
            <dd>{result.unit ?? '—'}</dd>
            <dt>Status</dt>
            <dd>{result.status}</dd>
          </dl>
        )}
      </Card>
    </main>
  );
}

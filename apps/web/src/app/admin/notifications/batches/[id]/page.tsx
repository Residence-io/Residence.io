import { fetchNotificationBatch } from '@/lib/supabase-data.server';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default async function BatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const batch = await fetchNotificationBatch(id);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Delivery batch"
        title="Batch progress"
        description="Recipient snapshots and idempotency protect scheduled processing from duplicate sends."
      />
      <Card>
        <p className="font-semibold">{batch.name}</p>
        <p className="text-sm text-slate-500">
          {batch.status} · {batch.processedCount}/{batch.estimatedCount}{' '}
          processed · {batch.successCount} successful · {batch.failedCount}{' '}
          failed
        </p>
        {batch.schedule && (
          <p className="mt-2 text-sm">
            Scheduled for{' '}
            {new Date(batch.schedule.scheduledAt).toLocaleString()}
          </p>
        )}
        <Link
          className="mt-4 inline-block font-semibold text-blue-700"
          href="/admin/notifications"
        >
          Back to dashboard
        </Link>
      </Card>
    </div>
  );
}

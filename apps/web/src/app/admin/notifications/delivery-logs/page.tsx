import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { DeliveryPage } from '@/lib/notification-types';
export default async function DeliveryLogs({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const data = await serverApi<DeliveryPage>(
    `/notifications/delivery-logs?${params}`,
  );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Communications"
        title="Delivery logs"
        description="Per-channel provider acceptance, delivery confirmation, retries, and safe failure information."
      />
      <Card>
        <form className="flex gap-3">
          <select
            name="status"
            defaultValue={q.status}
            className="rounded-xl border px-3 py-2"
          >
            <option value="">All statuses</option>
            <option>QUEUED</option>
            <option>DELIVERED</option>
            <option>FAILED</option>
            <option>SKIPPED</option>
          </select>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-white">
            Filter
          </button>
        </form>
      </Card>
      <Card>
        {data.items.length ? (
          <div className="divide-y">
            {data.items.map((item) => (
              <div className="py-4" key={item.id}>
                <p className="font-semibold">
                  {item.recipient.notification.subject ??
                    item.recipient.notification.notificationType}
                </p>
                <p className="text-sm text-slate-500">
                  {item.recipient.user.displayName} · {item.channel} ·{' '}
                  {item.status} · {item.destinationMasked ?? 'in-app'}
                </p>
                {item.failureReason && (
                  <p className="text-sm text-red-700">{item.failureReason}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No delivery records match the filters.</p>
        )}
      </Card>
    </div>
  );
}

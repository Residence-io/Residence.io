import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { AvailabilityForm } from '@/components/workforce/workforce-actions';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import type { WorkerSummary } from '@/lib/workforce-types';
export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ workerId?: string }>;
}) {
  const q = await searchParams;
  const [user, result] = await Promise.all([
    getCurrentUser(),
    serverApi<{ items: WorkerSummary[] }>(
      '/workforce/workers?status=AVAILABLE&pageSize=100',
    ),
  ]);
  const selected = q.workerId ?? result.items[0]?.id;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Scheduling"
        title="Worker availability"
        description="Regular hours, leave, temporary overrides, and reservations are evaluated in the society time zone."
      />
      <Card>
        <form>
          <select
            className="rounded-xl border px-3 py-2"
            name="workerId"
            defaultValue={selected}
          >
            {result.items.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.workerNumber} — {w.fullName}
              </option>
            ))}
          </select>
          <button className="ml-3 rounded-xl bg-slate-900 px-4 py-2 text-white">
            Select
          </button>
        </form>
      </Card>
      {user && selected && (
        <Card>
          <AvailabilityForm csrfToken={user.csrfToken} workerId={selected} />
        </Card>
      )}
    </div>
  );
}

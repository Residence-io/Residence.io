import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { LifecycleForm } from '@/components/workforce/workforce-actions';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import type { WorkerSummary } from '@/lib/workforce-types';

export default async function EditWorker({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [worker, user] = await Promise.all([
    serverApi<WorkerSummary>(`/workforce/workers/${id}`),
    getCurrentUser(),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={worker.workerNumber}
        title="Worker lifecycle"
        description="Availability, leave, suspension, deactivation, and archival require version checks and reasons."
      />
      <Card>
        <p className="mb-4 text-sm text-slate-600">
          Current status: {worker.status}.
        </p>
        {user && (
          <LifecycleForm
            csrfToken={user.csrfToken}
            kind="workers"
            id={id}
            version={worker.version}
            statuses={[
              'AVAILABLE',
              'OFF_DUTY',
              'ON_LEAVE',
              'SUSPENDED',
              'INACTIVE',
              'ARCHIVED',
            ]}
          />
        )}
      </Card>
    </div>
  );
}

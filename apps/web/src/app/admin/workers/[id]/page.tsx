import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { WorkerSummary } from '@/lib/workforce-types';
export default async function WorkerProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const worker = await serverApi<WorkerSummary>(`/workforce/workers/${id}`);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={worker.workerNumber}
        title={worker.fullName}
        description={`${worker.primaryCategory.name} · ${worker.status.replaceAll('_', ' ')} · ${worker.serviceArea}`}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Professional profile</h2>
          <p className="mt-3 text-sm">
            {worker.relationship.replaceAll('_', ' ')}
          </p>
          <p className="text-sm text-slate-500">
            Skills:{' '}
            {worker.skills.map((s) => s.skill.name).join(', ') || 'None'}
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">Contact</h2>
          <p className="mt-3 text-sm">{worker.primaryPhone}</p>
        </Card>
      </div>
      <Card>
        <div className="flex gap-4">
          <Link className="text-blue-700" href={`/admin/workers/${id}/edit`}>
            Edit and lifecycle
          </Link>
          <Link className="text-blue-700" href="/admin/workers/availability">
            Availability
          </Link>
        </div>
      </Card>
    </div>
  );
}

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { StaffSummary } from '@/lib/workforce-types';
export default async function StaffProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await serverApi<StaffSummary>(`/workforce/staff/${id}`);
  const employment = staff.employments[0];
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={staff.staffNumber}
        title={staff.fullName}
        description={`${staff.status.replaceAll('_', ' ')} · ${employment?.department.name ?? 'No department'} · ${employment?.jobTitle.name ?? 'No title'}`}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Personal information</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd>{staff.primaryPhone}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd>{staff.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Identity</dt>
              <dd>{staff.maskedIdentity ?? 'Not recorded'}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold">Employment</h2>
          <p className="mt-3 text-sm">
            {employment?.employmentType.replaceAll('_', ' ') ?? 'Not assigned'}
          </p>
          <p className="text-sm text-slate-500">
            Joined{' '}
            {employment
              ? new Date(employment.joiningDate).toLocaleDateString()
              : '—'}
          </p>
        </Card>
      </div>
      <Card>
        <div className="flex gap-4">
          <Link className="text-blue-700" href={`/admin/staff/${id}/edit`}>
            Edit and lifecycle
          </Link>
          <Link className="text-blue-700" href="/admin/staff/salaries">
            Salary history
          </Link>
        </div>
      </Card>
    </div>
  );
}

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { LifecycleForm } from '@/components/workforce/workforce-actions';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import type { StaffSummary } from '@/lib/workforce-types';

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, user] = await Promise.all([
    serverApi<StaffSummary>(`/workforce/staff/${id}`),
    getCurrentUser(),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={staff.staffNumber}
        title="Staff lifecycle"
        description="Sensitive status changes use version checks, effective dates, reasons, and audit history."
      />
      <Card>
        <p className="mb-4 text-sm text-slate-600">
          Current status: {staff.status}.
        </p>
        {user && (
          <LifecycleForm
            csrfToken={user.csrfToken}
            kind="staff"
            id={id}
            version={staff.version}
            statuses={[
              'ACTIVE',
              'ON_LEAVE',
              'SUSPENDED',
              'RESIGNED',
              'TERMINATED',
              'RETIRED',
              'ARCHIVED',
            ]}
          />
        )}
      </Card>
    </div>
  );
}

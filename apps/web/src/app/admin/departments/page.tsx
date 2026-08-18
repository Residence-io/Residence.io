import { serverApi } from '@/lib/api.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { DepartmentForms } from '@/components/workforce/workforce-actions';
import { getCurrentUser } from '@/lib/api.server';
import type { Department } from '@/lib/workforce-types';
export default async function DepartmentsPage() {
  const [user, departments] = await Promise.all([
    getCurrentUser(),
    serverApi('/workforce/departments'),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Staff setup"
        title="Departments and job titles"
        description="Referenced setup records are deactivated rather than deleted."
      />
      <Card>
        {user && (
          <DepartmentForms
            csrfToken={user.csrfToken}
            departments={departments}
          />
        )}
      </Card>
      <Card>
        {departments.map((d: any) => (
          <div className="border-b py-3 last:border-0" key={d.id}>
            <p className="font-semibold">
              {d.name} {!d.active && '(inactive)'}
            </p>
            <p className="text-sm text-slate-500">
              {d.jobTitles?.map((j: any) => j.name).join(', ') ||
                'No job titles'}
            </p>
          </div>
        ))}
      </Card>
    </div>
  );
}

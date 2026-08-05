import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { WorkerSetupForms } from '@/components/workforce/workforce-actions';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import type { WorkerSetup } from '@/lib/workforce-types';
export default async function WorkerCategoriesPage() {
  const [user, setup] = await Promise.all([
    getCurrentUser(),
    serverApi<WorkerSetup>('/workforce/worker-setup'),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Worker setup"
        title="Categories and skills"
        description="Workers can hold multiple skills while retaining one primary category."
      />
      <Card>{user && <WorkerSetupForms csrfToken={user.csrfToken} />}</Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Categories</h2>
          {setup.categories.map((c: any) => (
            <p className="mt-2 text-sm" key={c.id}>
              {c.code} — {c.name}
            </p>
          ))}
        </Card>
        <Card>
          <h2 className="font-semibold">Skills</h2>
          {setup.skills.map((s: any) => (
            <p className="mt-2 text-sm" key={s.id}>
              {s.name}
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}

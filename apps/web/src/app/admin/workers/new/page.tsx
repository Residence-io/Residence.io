import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { WorkerRegistrationForm } from '@/components/workforce/workforce-actions';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import type { WorkerSetup } from '@/lib/workforce-types';
export default async function NewWorkerPage() {
  const [user, setup] = await Promise.all([
    getCurrentUser(),
    serverApi<WorkerSetup>('/workforce/worker-setup'),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Workers"
        title="Register service worker"
        description="Worker identifiers remain stable after category changes. Account creation is separate."
      />
      <Card>
        {user && (
          <WorkerRegistrationForm csrfToken={user.csrfToken} setup={setup} />
        )}
      </Card>
    </div>
  );
}

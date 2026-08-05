import { Card } from '@/components/ui/card';
import { DuesGenerator } from '@/components/finance/finance-actions';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser } from '@/lib/api.server';
export default async function GenerateDuesPage() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Billing run"
        title="Generate monthly dues"
        description="Safe reruns use unique resident-period constraints and idempotent generation batches."
      />
      <Card>{user ? <DuesGenerator csrfToken={user.csrfToken} /> : null}</Card>
    </div>
  );
}

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { NotificationActions } from '@/components/notifications/notification-actions';
import { getCurrentUser } from '@/lib/api.server';
export default async function ComposePage() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Communications"
        title="Compose notification"
        description="Select explicit authorized recipients, preview the content, and create an idempotent delivery batch."
      />
      <Card>
        <NotificationActions csrfToken={user?.csrfToken ?? ''} mode="compose" />
      </Card>
    </div>
  );
}

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { NotificationActions } from '@/components/notifications/notification-actions';
import { getCurrentUser } from '@/lib/api.server';
export default async function NewAnnouncement() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Communications"
        title="Publish announcement"
        description="Audience membership is snapshotted when the announcement is confirmed."
      />
      <Card>
        <NotificationActions
          csrfToken={user?.csrfToken ?? ''}
          mode="announcement"
        />
      </Card>
    </div>
  );
}

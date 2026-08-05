import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { NotificationActions } from '@/components/notifications/notification-actions';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import type { NotificationPreference } from '@/lib/notification-types';
export default async function PreferencesPage() {
  const [user, preference] = await Promise.all([
    getCurrentUser(),
    serverApi<NotificationPreference>('/notifications/preferences'),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Resident portal"
        title="Notification preferences"
        description="Mandatory security and transactional in-app messages remain enabled."
      />
      <Card>
        <NotificationActions
          csrfToken={user?.csrfToken ?? ''}
          mode="preferences"
          initial={preference as unknown as Record<string, unknown>}
        />
      </Card>
    </div>
  );
}

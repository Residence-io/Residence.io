import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { InboxPage } from '@/lib/notification-types';
export default async function ResidentNotifications() {
  const data = await serverApi<InboxPage>('/notifications/inbox');
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Resident portal"
        title="Notifications"
        description={`${data.unread} unread notification${data.unread === 1 ? '' : 's'} in your private inbox.`}
      />
      <Link
        className="font-semibold text-blue-700"
        href="/resident/notifications/preferences"
      >
        Notification preferences
      </Link>
      <Card>
        {data.items.length ? (
          <div className="divide-y">
            {data.items.map((item) => (
              <Link
                className="block py-4"
                href={`/resident/notifications/${item.id}`}
                key={item.id}
              >
                <p
                  className={
                    item.readStatus === 'UNREAD' ? 'font-bold' : 'font-semibold'
                  }
                >
                  {item.notification.subject ??
                    item.notification.notificationType}
                </p>
                <p className="line-clamp-2 text-sm text-slate-600">
                  {item.notification.renderedContent}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleString()} ·{' '}
                  {item.notification.priority}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p>You have no notifications.</p>
        )}
      </Card>
    </div>
  );
}

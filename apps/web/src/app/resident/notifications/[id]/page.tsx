import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { InboxPage } from '@/lib/notification-types';
export default async function NotificationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await serverApi<InboxPage>('/notifications/inbox?pageSize=100');
  const item = data.items.find((entry) => entry.id === id);
  if (!item) notFound();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={item.notification.notificationType}
        title={item.notification.subject ?? 'Notification'}
        description={new Date(item.createdAt).toLocaleString()}
      />
      <Card>
        <p className="whitespace-pre-wrap">
          {item.notification.renderedContent}
        </p>
        {item.notification.expiresAt && (
          <p className="mt-4 text-sm text-slate-500">
            Expires {new Date(item.notification.expiresAt).toLocaleString()}
          </p>
        )}
      </Card>
    </div>
  );
}

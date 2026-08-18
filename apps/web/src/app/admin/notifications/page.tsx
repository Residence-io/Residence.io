import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { NotificationDashboard } from '@/lib/notification-types';
export default async function NotificationDashboardPage() {
  const data = await serverApi<NotificationDashboard>(
    '/notifications/dashboard',
  );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Communications"
        title="Notification dashboard"
        description="Database-backed delivery, scheduling, failures, and in-app readership."
      />
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ['Sent today', data.sentToday],
          ['Scheduled', data.scheduled],
          ['Failed', data.failed],
          ['My unread', data.unread],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex flex-wrap gap-5">
          <Link
            className="font-semibold text-blue-700"
            href="/admin/notifications/compose"
          >
            Compose notification
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/announcements"
          >
            Announcements
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/notifications/templates"
          >
            Templates
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/notifications/delivery-logs"
          >
            Delivery logs
          </Link>
        </div>
      </Card>
    </div>
  );
}

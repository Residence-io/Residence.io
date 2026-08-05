import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { AnnouncementPage } from '@/lib/notification-types';
export default async function AnnouncementsPage() {
  const data = await serverApi<AnnouncementPage>(
    '/notifications/announcements',
  );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Communications"
        title="Announcements"
        description="Draft, scheduled, published, expired, and emergency society communications."
      />
      <Link
        className="inline-block rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white"
        href="/admin/announcements/new"
      >
        New announcement
      </Link>
      <Card>
        {data.items.length ? (
          <div className="divide-y">
            {data.items.map((item) => (
              <Link
                href={`/admin/announcements/${item.id}`}
                className="block py-4"
                key={item.id}
              >
                <span className="font-semibold">
                  {item.emergency ? 'Emergency: ' : ''}
                  {item.subject}
                </span>
                <span className="ml-3 text-sm text-slate-500">
                  {item.status} · {item.category} · {item._count.snapshots}{' '}
                  recipients
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p>No announcements.</p>
        )}
      </Card>
    </div>
  );
}

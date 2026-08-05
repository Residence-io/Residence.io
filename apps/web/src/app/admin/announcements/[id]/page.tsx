import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
export default async function AnnouncementDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const announcement = await serverApi<{
    subject: string;
    message: string;
    category: string;
    status: string;
    priority: string;
    snapshots: unknown[];
  }>(`/notifications/announcements/${id}`);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Announcement"
        title="Publication record"
        description="Published announcements retain their original audience snapshot."
      />
      <Card>
        <p className="font-semibold">{announcement.subject}</p>
        <p className="text-sm text-slate-500">
          {announcement.status} · {announcement.category} ·{' '}
          {announcement.priority} · {announcement.snapshots.length} recipients
          shown
        </p>
        <p className="mt-4 whitespace-pre-wrap">{announcement.message}</p>
        <Link
          className="mt-4 inline-block font-semibold text-blue-700"
          href="/admin/announcements"
        >
          Back to announcements
        </Link>
      </Card>
    </div>
  );
}

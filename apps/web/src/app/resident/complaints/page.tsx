import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { TicketPage } from '@/lib/ticket-types';
export default async function Complaints() {
  const result = await serverApi<TicketPage>('/tickets/complaints');
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="My requests"
        title="Complaints"
        description="Track only your own society complaints and responses."
      />
      <Link
        className="rounded-xl bg-blue-700 px-4 py-2 text-white"
        href="/resident/complaints/new"
      >
        Submit complaint
      </Link>
      <Card>
        {result.items.length ? (
          result.items.map((t) => (
            <Link
              className="block border-b py-4"
              href={`/resident/complaints/${t.id}`}
              key={t.id}
            >
              <b>
                {t.ticketNumber} — {t.subject}
              </b>
              <span className="ml-3 text-sm text-slate-500">{t.status}</span>
            </Link>
          ))
        ) : (
          <p>You have no complaints.</p>
        )}
      </Card>
    </div>
  );
}

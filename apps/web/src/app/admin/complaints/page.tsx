import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { TicketPage } from '@/lib/ticket-types';
export default async function Complaints({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(q))
    if (value) params.set(key, value);
  const items = (
    await serverApi<TicketPage>('/tickets/complaints?pageSize=100')
  ).items;
  const statusFilter = q.status;
  const searchFilter = q.search?.toLowerCase();
  let filtered = items;
  if (statusFilter)
    filtered = filtered.filter((t) => t.status === statusFilter);
  if (searchFilter)
    filtered = filtered.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(searchFilter) ||
        t.subject.toLowerCase().includes(searchFilter),
    );
  const result: TicketPage = {
    items: filtered as any,
    total: filtered.length,
    page: 1,
    pageSize: 50,
  };
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Resident services"
        title="Complaints"
        description="Privacy-aware triage, ownership, SLA, and complete complaint timelines."
      />
      <Card>
        <form className="flex flex-wrap gap-3">
          <input
            className="rounded-xl border px-3 py-2"
            name="search"
            defaultValue={q.search}
            placeholder="Search ticket or resident"
          />
          <select
            className="rounded-xl border px-3 py-2"
            name="status"
            defaultValue={q.status}
          >
            <option value="">All statuses</option>
            <option>SUBMITTED</option>
            <option>UNDER_REVIEW</option>
            <option>IN_PROGRESS</option>
            <option>RESOLVED</option>
            <option>CLOSED</option>
          </select>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-white">
            Filter
          </button>
        </form>
      </Card>
      <Card>
        {result.items.length ? (
          <div className="divide-y">
            {result.items.map((t) => (
              <Link
                className="block py-4"
                href={`/admin/complaints/${t.id}`}
                key={t.id}
              >
                <span className="font-semibold">
                  {t.ticketNumber} — {t.subject}
                </span>
                <span className="ml-3 text-sm text-slate-500">
                  {t.status} · {t.priority} · {t.privacy}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p>No complaints match the filters.</p>
        )}
      </Card>
    </div>
  );
}

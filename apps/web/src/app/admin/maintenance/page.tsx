import { serverApi } from '@/lib/api.server';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import type { TicketPage } from '@/lib/ticket-types';
export default async function Maintenance({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(q))
    if (value) params.set(key, value);
  const [maintenancePage, dashboard] = await Promise.all([
    serverApi<any>('/tickets/maintenance?pageSize=100'),
    serverApi<any>('/tickets/dashboard'),
  ]);
  const statusFilter = q.status;
  const searchFilter = q.search?.toLowerCase();
  let filtered = maintenancePage.items;
  if (statusFilter)
    filtered = filtered.filter((t: any) => t.status === statusFilter);
  if (searchFilter)
    filtered = filtered.filter(
      (t: any) =>
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
        eyebrow="Operations"
        title="Maintenance requests"
        description="Triage, worker assignment, appointments, resolution, and SLA tracking."
      />
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Unassigned', dashboard.unassigned],
          ['Urgent', dashboard.urgent],
          ['Overdue', dashboard.overdue],
          ["Today's visits", dashboard.todayAppointments],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <form className="flex flex-wrap gap-3">
          <input
            className="rounded-xl border px-3 py-2"
            name="search"
            defaultValue={q.search}
            placeholder="Search tickets"
          />
          <select
            className="rounded-xl border px-3 py-2"
            name="status"
            defaultValue={q.status}
          >
            <option value="">All statuses</option>
            <option>SUBMITTED</option>
            <option>APPROVED</option>
            <option>ASSIGNED</option>
            <option>VISIT_SCHEDULED</option>
            <option>WORK_IN_PROGRESS</option>
            <option>COMPLETED</option>
          </select>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-white">
            Filter
          </button>
        </form>
      </Card>
      <Card>
        {result.items.length ? (
          result.items.map((t) => (
            <Link
              className="block border-b py-4"
              href={`/admin/maintenance/${t.id}`}
              key={t.id}
            >
              <b>
                {t.ticketNumber} — {t.subject}
              </b>
              <span className="ml-3 text-sm text-slate-500">
                {t.status} · {t.priority}
              </span>
            </Link>
          ))
        ) : (
          <p>No requests match the filters.</p>
        )}
      </Card>
    </div>
  );
}

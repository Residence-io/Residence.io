import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { fetchServiceWorkers } from '@/lib/supabase-data.server';
import type { WorkerSummary } from '@/lib/workforce-types';
export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const q = await searchParams;
  const items = await fetchServiceWorkers();
  const statusFilter = q.status;
  const searchFilter = q.search?.toLowerCase();
  let filtered = items;
  if (statusFilter)
    filtered = filtered.filter((t: any) => t.status === statusFilter);
  if (searchFilter)
    filtered = filtered.filter(
      (t: any) =>
        t.workerNumber.toLowerCase().includes(searchFilter) ||
        t.fullName.toLowerCase().includes(searchFilter) ||
        t.primaryCategory.name.toLowerCase().includes(searchFilter),
    );
  const result = {
    items: filtered as any,
    total: filtered.length,
    page: 1,
    pageSize: 50,
  };
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Operations"
        title="Service workers"
        description="Internal workers and external contractors with categories, skills, availability, and service areas."
      />
      <Card>
        <form className="flex flex-wrap gap-3">
          <input
            className="rounded-xl border px-3 py-2"
            name="search"
            defaultValue={q.search}
            placeholder="Worker ID, name, phone, category"
          />
          <select
            className="rounded-xl border px-3 py-2"
            name="status"
            defaultValue={q.status}
          >
            <option value="">All statuses</option>
            {[
              'AVAILABLE',
              'BUSY',
              'OFF_DUTY',
              'ON_LEAVE',
              'SUSPENDED',
              'INACTIVE',
              'ARCHIVED',
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-white">
            Filter
          </button>
          <Link
            className="rounded-xl bg-blue-600 px-4 py-2 text-white"
            href="/admin/workers/new"
          >
            Register worker
          </Link>
        </form>
      </Card>
      <Card>
        {result.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Worker ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Skills</th>
                  <th>Area</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((w: any) => (
                  <tr className="border-t" key={w.id}>
                    <td>
                      <Link
                        className="text-blue-700"
                        href={`/admin/workers/${w.id}`}
                      >
                        {w.workerNumber}
                      </Link>
                    </td>
                    <td>{w.fullName}</td>
                    <td>{w.primaryCategory.name}</td>
                    <td>{w.skills.map((s: any) => s.skill.name).join(', ')}</td>
                    <td>{w.serviceArea}</td>
                    <td>{w.status.replaceAll('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No workers match these filters.</p>
        )}
        <p className="mt-4 text-sm text-slate-500">{result.total} worker(s)</p>
      </Card>
    </div>
  );
}

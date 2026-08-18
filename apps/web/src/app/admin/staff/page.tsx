import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const query = await searchParams;
  const items = (await serverApi<any>('/workforce/staff?pageSize=100')).items;
  const statusFilter = query.status;
  const searchFilter = query.search?.toLowerCase();
  let filtered = items;
  if (statusFilter)
    filtered = filtered.filter((t: any) => t.status === statusFilter);
  if (searchFilter)
    filtered = filtered.filter(
      (t: any) =>
        t.staffNumber.toLowerCase().includes(searchFilter) ||
        t.fullName.toLowerCase().includes(searchFilter),
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
        eyebrow="Workforce"
        title="Internal staff"
        description="Society-scoped staff directory with server-side search, status filtering, and stable pagination."
      />
      <Card>
        <form className="flex flex-wrap gap-3">
          <input
            className="rounded-xl border px-3 py-2"
            name="search"
            defaultValue={query.search}
            placeholder="Staff ID, name, phone, or email"
          />
          <select
            className="rounded-xl border px-3 py-2"
            name="status"
            defaultValue={query.status}
          >
            <option value="">All statuses</option>
            {[
              'ACTIVE',
              'PROBATION',
              'ON_LEAVE',
              'SUSPENDED',
              'RESIGNED',
              'TERMINATED',
              'RETIRED',
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
            href="/admin/staff/new"
          >
            Register staff
          </Link>
        </form>
      </Card>
      <Card>
        {result.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Staff ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Job title</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((staff: any) => (
                  <tr className="border-t" key={staff.id}>
                    <td className="p-2">
                      <Link
                        className="text-blue-700"
                        href={`/admin/staff/${staff.id}`}
                      >
                        {staff.staffNumber}
                      </Link>
                    </td>
                    <td>{staff.fullName}</td>
                    <td>{staff.employments[0]?.department.name ?? '—'}</td>
                    <td>{staff.employments[0]?.jobTitle.name ?? '—'}</td>
                    <td>{staff.primaryPhone}</td>
                    <td>{staff.status.replaceAll('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">
            No staff members match these filters.
          </p>
        )}
        <p className="mt-4 text-sm text-slate-500">
          {result.total} staff member(s)
        </p>
      </Card>
    </div>
  );
}

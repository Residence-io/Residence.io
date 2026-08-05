export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/ui/page-header';
import { ResidentListDeleteButton } from '@/components/residents/resident-list-delete-button';
import { getCurrentUser } from '@/lib/api.server';
import { fetchResidents } from '@/lib/supabase-data.server';
import type { ResidentPage } from '@/lib/resident-types';

export const metadata = { title: 'Residents' };
export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const status =
    typeof params.status === 'string' &&
    ['ALL', 'ACTIVE', 'INACTIVE', 'PREVIOUS'].includes(params.status)
      ? params.status
      : 'ACTIVE';
  for (const key of [
    'search',
    'occupancyType',
    'block',
    'propertyType',
    'page',
    'sort',
    'direction',
  ]) {
    const value = params[key];
    if (typeof value === 'string' && value) query.set(key, value);
  }
  query.set('status', status);
  let data: ResidentPage;
  try {
    const items = await fetchResidents();
    // Filter and paginate locally since Supabase helper doesn't support complex params yet
    const page = Number(params.page) || 1;
    const pageSize = 50;
    const filtered = items.filter(
      (item: any) => status === 'ALL' || item.status === status,
    );
    data = {
      items: filtered.slice((page - 1) * pageSize, page * pageSize) as any,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    };
  } catch (error) {
    return (
      <Alert>
        {error instanceof Error
          ? error.message
          : 'Residents could not be loaded.'}
        <br />
        <small>Version: v2</small>
      </Alert>
    );
  }
  const user = await getCurrentUser();
  const canDelete = Boolean(user?.permissions.includes('RESIDENT_ARCHIVE'));
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <PageHeader
          eyebrow="Resident management"
          title="Residents"
          description={`${data.total} resident record${data.total === 1 ? '' : 's'} found.`}
        />
        <Link href="/admin/residents/new">
          <Button>Register resident</Button>
        </Link>
      </div>
      <Card>
        <form className="grid gap-3 md:grid-cols-5" method="get">
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2"
            name="search"
            defaultValue={
              typeof params.search === 'string' ? params.search : ''
            }
            placeholder="Name, ID, username, phone, unit"
            aria-label="Search residents"
          />
          <select
            className="rounded-xl border border-slate-300 px-3 py-2"
            name="status"
            defaultValue={status}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PREVIOUS">Previous</option>
          </select>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2"
            name="occupancyType"
            defaultValue={
              typeof params.occupancyType === 'string'
                ? params.occupancyType
                : ''
            }
          >
            <option value="">Owner or tenant</option>
            <option>OWNER</option>
            <option>TENANT</option>
          </select>
          <Button type="submit">Apply filters</Button>
        </form>
      </Card>
      {!data.items.length ? (
        <EmptyState title="No residents found">
          Change the filters or register the first resident.
        </EmptyState>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                {[
                  'Resident ID',
                  'Name',
                  'Username',
                  'Block / unit',
                  'Type',
                  'Phone',
                  'Move-in',
                  'Status',
                  'Actions',
                ].map((h) => (
                  <th className="px-4 py-3" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((resident) => {
                const occupancy =
                  resident.occupancies.find((item) => !item.endDate) ??
                  resident.occupancies[0];
                return (
                  <tr className="border-t border-slate-200" key={resident.id}>
                    <td className="px-4 py-3 font-semibold">
                      {resident.residentNumber}
                    </td>
                    <td className="px-4 py-3">{resident.fullName}</td>
                    <td className="px-4 py-3">
                      {resident.user?.username ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {occupancy
                        ? `${occupancy.unit.property.block} / ${occupancy.unit.unitNumber}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {occupancy?.occupancyType ?? '—'}
                    </td>
                    <td className="px-4 py-3">{resident.primaryPhone}</td>
                    <td className="px-4 py-3">
                      {occupancy?.startDate?.slice(0, 10) ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                        {resident.status === 'MOVED_OUT' ||
                        resident.status === 'ARCHIVED'
                          ? 'Previous'
                          : resident.status === 'INACTIVE' ||
                              resident.status === 'SUSPENDED' ||
                              (resident.user &&
                                resident.user.status !== 'ACTIVE')
                            ? 'Inactive'
                            : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          className="font-semibold text-blue-700"
                          href={`/admin/residents/${resident.id}`}
                        >
                          View
                        </Link>
                        {canDelete && user && (
                          <ResidentListDeleteButton
                            csrfToken={user.csrfToken}
                            residentId={resident.id}
                            residentName={resident.fullName}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <nav className="flex justify-between text-sm" aria-label="Resident pages">
        <span>
          Page {data.page} of {Math.max(data.totalPages, 1)}
        </span>
        <div className="flex gap-3">
          {data.page > 1 && (
            <Link
              href={`?${new URLSearchParams({ ...Object.fromEntries(query), page: String(data.page - 1) })}`}
            >
              Previous
            </Link>
          )}
          {data.page < data.totalPages && (
            <Link
              href={`?${new URLSearchParams({ ...Object.fromEntries(query), page: String(data.page + 1) })}`}
            >
              Next
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}

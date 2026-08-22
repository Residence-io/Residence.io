import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';

type Audit = {
  id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  outcome: string;
  reason?: string;
  createdAt: string;
  actor?: { id: string; displayName: string; username: string };
  safeMetadata: unknown;
};

type Result = {
  items: Audit[];
  total: number;
  page: number;
  pageSize: number;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    action?: string;
    entity?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const filters = await searchParams;
  const page = Math.max(1, parseInt(filters.page || '1', 10));
  const pageSize = 50;

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (filters.search) params.set('search', filters.search);
  if (filters.action) params.set('action', filters.action);
  if (filters.entity) params.set('entity', filters.entity);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const result = await serverApi<Result>(
    `/administration/audit-logs?${params.toString()}`,
  ).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 50,
  }));

  const totalPages = Math.ceil(result.total / pageSize);

  function makePageUrl(newPage: number) {
    const p = new URLSearchParams();
    p.set('page', String(newPage));
    if (filters.search) p.set('search', filters.search);
    if (filters.action) p.set('action', filters.action);
    if (filters.entity) p.set('entity', filters.entity);
    if (filters.from) p.set('from', filters.from);
    if (filters.to) p.set('to', filters.to);
    return `/admin/audit-logs?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity Center"
        title="Activity & Audit Logs"
        description={`${result.total} append-only, society-scoped event(s). Confidential credentials and secrets are redacted.`}
      />

      <form className="grid gap-3 sm:grid-cols-2 md:grid-cols-6 rounded-2xl bg-slate-50 p-4 border border-slate-200">
        <input
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          name="search"
          placeholder="Search keywords / ID / reason"
          defaultValue={filters.search}
        />
        <input
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          name="action"
          placeholder="Action (e.g. RESIDENT_CREATED)"
          defaultValue={filters.action}
        />
        <input
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          name="entity"
          placeholder="Entity (e.g. Resident, Property)"
          defaultValue={filters.entity}
        />
        <input
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          type="date"
          name="from"
          defaultValue={filters.from}
        />
        <input
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          type="date"
          name="to"
          defaultValue={filters.to}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-800 transition-colors text-sm"
          >
            Filter
          </button>
          <Link
            href="/admin/audit-logs"
            className="flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Reset
          </Link>
        </div>
      </form>

      {result.items.length ? (
        <div className="space-y-4">
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {result.items.map((event) => (
              <div
                key={event.id}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                        event.outcome === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                          : event.outcome === 'DENIED'
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                            : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20'
                      }`}
                    >
                      {event.outcome}
                    </span>
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {event.action}
                    </span>
                    {event.targetType && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {event.targetType}
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-slate-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </time>
                </div>

                <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    <strong>Actor:</strong>{' '}
                    {event.actor?.displayName ?? 'System'} (
                    {event.actor?.username ?? 'system'})
                  </span>
                  {event.targetId && (
                    <span>
                      <strong>Target ID:</strong>{' '}
                      <code className="text-slate-800">{event.targetId}</code>
                    </span>
                  )}
                  {event.reason && (
                    <span>
                      <strong>Reason:</strong> {event.reason}
                    </span>
                  )}
                </div>

                {Boolean(
                  event.safeMetadata &&
                  typeof event.safeMetadata === 'object' &&
                  Object.keys(event.safeMetadata as Record<string, unknown>)
                    .length > 0,
                ) && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer font-medium text-blue-700 hover:text-blue-900">
                      View details
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-emerald-300 font-mono text-[11px] leading-relaxed">
                      {JSON.stringify(event.safeMetadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-xl border">
              <div className="text-sm text-slate-700">
                Page <span className="font-semibold">{page}</span> of{' '}
                <span className="font-semibold">{totalPages}</span> (
                {result.total} events)
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={makePageUrl(page - 1)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={makePageUrl(page + 1)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState title="No activity events found">
          No audit log events match the selected criteria.
        </EmptyState>
      )}
    </div>
  );
}

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/ui/page-header';
import { fetchAuditLogs } from '@/lib/supabase-data.server';
type Audit = {
  id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  outcome: string;
  reason?: string;
  createdAt: string;
  actor?: { displayName: string; username: string };
  safeMetadata: unknown;
};
type Result = { items: Audit[]; total: number };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    action?: string;
    entity?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const filters = await searchParams;
  const items = await fetchAuditLogs();

  let filtered = items;
  if (filters.action)
    filtered = filtered.filter((t: any) =>
      t.action.toLowerCase().includes(filters.action!.toLowerCase()),
    );
  if (filters.entity)
    filtered = filtered.filter((t: any) =>
      t.targetType?.toLowerCase().includes(filters.entity!.toLowerCase()),
    );
  if (filters.search)
    filtered = filtered.filter(
      (t: any) =>
        t.outcome.toLowerCase().includes(filters.search!.toLowerCase()) ||
        JSON.stringify(t.safeMetadata)
          .toLowerCase()
          .includes(filters.search!.toLowerCase()),
    );

  const result: Result = { items: filtered as any, total: filtered.length };
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Audit logs"
        description={`${result.total} append-only, society-scoped event(s). Protected fields are redacted.`}
      />
      <form className="grid gap-3 md:grid-cols-5">
        <input
          className="min-h-11 rounded-xl border px-3"
          name="search"
          placeholder="Search"
          defaultValue={filters.search}
        />
        <input
          className="min-h-11 rounded-xl border px-3"
          name="action"
          placeholder="Action"
          defaultValue={filters.action}
        />
        <input
          className="min-h-11 rounded-xl border px-3"
          name="entity"
          placeholder="Entity"
          defaultValue={filters.entity}
        />
        <input
          className="min-h-11 rounded-xl border px-3"
          type="date"
          name="from"
          defaultValue={filters.from}
        />
        <button className="rounded-xl bg-slate-900 px-4 text-white">
          Filter
        </button>
      </form>
      {result.items.length ? (
        result.items.map((event: any) => (
          <Card key={event.id}>
            <div className="flex flex-wrap justify-between">
              <h2 className="font-bold">{event.action}</h2>
              <span className="text-sm">{event.outcome}</span>
            </div>
            <p className="text-sm text-slate-600">
              {event.actor?.displayName ?? 'System'} · {event.targetType ?? '—'}{' '}
              · {new Date(event.createdAt).toLocaleString()}
            </p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs">
              {JSON.stringify(event.safeMetadata, null, 2)}
            </pre>
          </Card>
        ))
      ) : (
        <EmptyState title="No audit events">
          No events match the selected filters.
        </EmptyState>
      )}
    </div>
  );
}

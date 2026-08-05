import { fetchReport } from '@/lib/supabase-data.server';
import { API_URL } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/ui/page-header';

type Result = {
  code: string;
  items: Record<string, unknown>[];
  total: number;
  summary: { records: number };
};
const text = (value: unknown) =>
  value && typeof value === 'object'
    ? JSON.stringify(value)
    : String(value ?? '');
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ report: string }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { report } = await params;
  const filters = await searchParams;
  const query = new URLSearchParams(
    Object.entries(filters).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
  const result = await fetchReport(report, query.toString());
  const columns = result.items.length
    ? Object.keys(result.items[0]).slice(0, 8)
    : [];
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title={report.replaceAll('-', ' ')}
        description={`${result.total} matching record(s), calculated from current society data.`}
      />
      <form className="grid gap-3 sm:grid-cols-5">
        <input
          className="min-h-11 rounded-xl border px-3"
          name="search"
          placeholder="Search"
          defaultValue={filters.search}
        />
        <input
          className="min-h-11 rounded-xl border px-3"
          name="status"
          placeholder="Status"
          defaultValue={filters.status}
        />
        <input
          className="min-h-11 rounded-xl border px-3"
          type="date"
          name="from"
          defaultValue={filters.from}
        />
        <input
          className="min-h-11 rounded-xl border px-3"
          type="date"
          name="to"
          defaultValue={filters.to}
        />
        <button className="rounded-xl bg-slate-900 px-4 text-white">
          Apply filters
        </button>
      </form>
      <a
        className="font-semibold text-blue-700"
        href={`${API_URL}/reports/${report}.csv?${query}`}
      >
        Export filtered CSV →
      </a>
      {result.items.length ? (
        <Card className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th className="border-b p-3" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.items.map((item: any, index: any) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td
                      className="max-w-xs border-b p-3 align-top"
                      key={column}
                    >
                      {text(item[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="No report records">
          No data matches the selected filters.
        </EmptyState>
      )}
    </div>
  );
}

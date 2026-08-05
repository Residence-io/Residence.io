import { fetchReportsList } from '@/lib/supabase-data.server';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

type Report = { code: string; name: string };
export default async function Page() {
  const reports = await fetchReportsList();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Reports"
        description="Society-isolated operational reports with bounded, audited CSV exports."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.code}>
            <h2 className="font-bold">{report.name}</h2>
            <Link
              className="mt-3 inline-block font-semibold text-blue-700"
              href={`/admin/reports/${report.code}`}
            >
              Open report →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

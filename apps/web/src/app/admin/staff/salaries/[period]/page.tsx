import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { SalaryRecordActions } from '@/components/workforce/workforce-actions';
import { getCurrentUser } from '@/lib/api.server';
import { fetchSalaries } from '@/lib/supabase-data.server';
import type { SalaryRecord } from '@/lib/workforce-types';

export default async function SalaryPeriodPage({
  params,
}: {
  params: Promise<{ period: string }>;
}) {
  const { period } = await params;
  const [records, user] = await Promise.all([
    fetchSalaries(),
    getCurrentUser(),
  ]);
  const selected = records.filter(
    (record: any) =>
      `${record.salaryPeriod.year}-${String(record.salaryPeriod.month).padStart(2, '0')}` ===
      period,
  );
  const apiUrl = '/api';
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Salary period"
        title={period}
        description="Effective salary snapshots, payment progress, and generated slips."
      />
      <Card>
        {selected.length ? (
          selected.map((record: any) => (
            <div className="border-b py-4 last:border-0" key={record.id}>
              <p className="font-semibold">
                {record.staff.fullName} · {record.currency} {record.netPayable}
              </p>
              <p className="text-sm text-slate-500">
                Paid {record.amountPaid} · {record.status} ·{' '}
                {record.slips.length} slip(s)
              </p>
              {user && (
                <SalaryRecordActions
                  csrfToken={user.csrfToken}
                  recordId={record.id}
                  currency={record.currency}
                />
              )}
              <div className="mt-2">
                {record.slips.map((slip: any) => (
                  <a
                    className="mr-3 text-sm text-blue-700"
                    key={slip.id}
                    href={`${apiUrl}/workforce/salary-slips/${slip.id}`}
                  >
                    Download {slip.slipNumber}
                  </a>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p>No records for this period.</p>
        )}
      </Card>
    </div>
  );
}

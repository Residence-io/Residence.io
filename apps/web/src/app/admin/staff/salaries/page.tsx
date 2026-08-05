import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { SalaryGenerationForm } from '@/components/workforce/workforce-actions';
import { getCurrentUser, serverApi } from '@/lib/api.server';
import type { SalaryRecord } from '@/lib/workforce-types';
export default async function SalariesPage() {
  const [user, records] = await Promise.all([
    getCurrentUser(),
    serverApi<SalaryRecord[]>('/workforce/salaries?pageSize=100'),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Payroll"
        title="Salary records"
        description="Staff payroll remains separate from resident dues and payments."
      />
      <Card>{user && <SalaryGenerationForm csrfToken={user.csrfToken} />}</Card>
      <Card>
        {records.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Staff</th>
                  <th>Net</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r: any) => (
                  <tr className="border-t" key={r.id}>
                    <td>
                      <Link
                        className="text-blue-700"
                        href={`/admin/staff/salaries/${r.salaryPeriod.year}-${String(r.salaryPeriod.month).padStart(2, '0')}`}
                      >
                        {r.salaryPeriod.year}-
                        {String(r.salaryPeriod.month).padStart(2, '0')}
                      </Link>
                    </td>
                    <td>{r.staff.fullName}</td>
                    <td>
                      {r.currency} {r.netPayable}
                    </td>
                    <td>
                      {r.currency} {r.amountPaid}
                    </td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No salary records generated.</p>
        )}
      </Card>
    </div>
  );
}

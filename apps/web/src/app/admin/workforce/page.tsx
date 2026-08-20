import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function WorkforceOverview() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Operations"
        title="Workforce"
        description="Internal staff, contracted service workers, scheduling, and payroll."
      />
      <Card>
        <div className="flex flex-wrap gap-4">
          <Link className="font-semibold text-blue-700" href="/admin/staff">
            Employees (Staff)
          </Link>
          <Link className="font-semibold text-blue-700" href="/admin/workers">
            Service Workers
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/staff/salaries"
          >
            Payroll & Salaries
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-bold mb-2">Configuration</h2>
          <p className="text-sm text-slate-500 mb-4">
            Manage organizational structure
          </p>
          <div className="flex flex-col gap-2">
            <Link className="text-sm text-blue-700" href="/admin/departments">
              Departments
            </Link>
            <Link
              className="text-sm text-blue-700"
              href="/admin/worker-categories"
            >
              Worker Categories
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

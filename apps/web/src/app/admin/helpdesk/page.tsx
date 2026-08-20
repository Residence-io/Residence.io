import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';

export default async function HelpdeskOverview() {
  const dashboard = await serverApi<any>('/tickets/dashboard');

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Operations"
        title="Helpdesk & Maintenance"
        description="Unified hub for complaints, maintenance requests, worker assignments, and SLAs."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Unassigned requests', dashboard.unassigned],
          ['Urgent issues', dashboard.urgent],
          ['Overdue SLAs', dashboard.overdue],
          ["Today's visits", dashboard.todayAppointments],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex flex-wrap gap-4">
          <Link
            className="font-semibold text-blue-700"
            href="/admin/complaints"
          >
            Resident Complaints
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/maintenance"
          >
            Maintenance Requests
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/maintenance/calendar"
          >
            Assignment Calendar
          </Link>
          <Link
            className="font-semibold text-blue-700"
            href="/admin/maintenance/unassigned"
          >
            Unassigned Queue
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-bold mb-2">Configuration</h2>
          <p className="text-sm text-slate-500 mb-4">
            Manage categories and SLA policies
          </p>
          <div className="flex flex-col gap-2">
            <Link
              className="text-sm text-blue-700"
              href="/admin/complaint-categories"
            >
              Complaint Categories
            </Link>
            <Link
              className="text-sm text-blue-700"
              href="/admin/maintenance-categories"
            >
              Maintenance Categories
            </Link>
            <Link
              className="text-sm text-blue-700"
              href="/admin/service-levels"
            >
              Service Level Policies (SLA)
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

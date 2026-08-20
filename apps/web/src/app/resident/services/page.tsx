import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function ServicesOverview() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Services"
        title="Help & Services"
        description="Submit complaints and request maintenance for your property."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold mb-2">Complaints</h2>
          <p className="text-sm text-slate-500 mb-6">
            Report an issue regarding security, neighbors, cleanliness, or
            society rules.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-blue-600 px-4 py-2 text-white font-medium text-sm"
              href="/resident/complaints/new"
            >
              New Complaint
            </Link>
            <Link
              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 font-medium text-sm"
              href="/resident/complaints"
            >
              View History
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-2">Maintenance</h2>
          <p className="text-sm text-slate-500 mb-6">
            Request repairs or technical assistance for your unit or common
            areas.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-blue-600 px-4 py-2 text-white font-medium text-sm"
              href="/resident/maintenance/new"
            >
              Request Maintenance
            </Link>
            <Link
              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 font-medium text-sm"
              href="/resident/maintenance"
            >
              View History
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

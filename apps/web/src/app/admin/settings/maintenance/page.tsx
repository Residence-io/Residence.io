import Link from 'next/link';
import { SettingsForm } from '@/components/phase7/settings-form';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
export default async function Page() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    serverApi<{ data: Record<string, unknown>; version: number }>(
      '/settings/sections/maintenance',
    ),
  ]);
  const fields = [
    {
      name: 'residentVisibleStatusLabels',
      label: 'Resident-visible status labels',
      type: 'list',
    },
    { name: 'autoCloseDays', label: 'Auto-close after days', type: 'number' },
    { name: 'reopenWindowDays', label: 'Reopen window days', type: 'number' },
    { name: 'assignmentStrategy', label: 'Worker assignment strategy' },
    {
      name: 'emergencyCategories',
      label: 'Emergency category codes',
      type: 'list',
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Complaint and maintenance settings"
        description="Operational policy plus the existing category and SLA configuration."
      />
      <div className="flex flex-wrap gap-4">
        <Link
          className="font-semibold text-blue-700"
          href="/admin/complaint-categories"
        >
          Complaint categories →
        </Link>
        <Link
          className="font-semibold text-blue-700"
          href="/admin/maintenance-categories"
        >
          Maintenance categories →
        </Link>
        <Link
          className="font-semibold text-blue-700"
          href="/admin/service-levels"
        >
          SLA policies →
        </Link>
      </div>
      <Card>
        <SettingsForm
          section="maintenance"
          initial={settings.data}
          version={settings.version}
          fields={fields}
          csrfToken={user?.csrfToken ?? ''}
        />
      </Card>
    </div>
  );
}

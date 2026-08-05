import Link from 'next/link';
import { SettingsForm } from '@/components/phase7/settings-form';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
export default async function Page() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    serverApi<{ data: Record<string, unknown>; version: number }>(
      '/settings/sections/notifications',
    ),
  ]);
  const fields = [
    { name: 'enabledChannels', label: 'Enabled channels', type: 'list' },
    { name: 'emailMode', label: 'Email mode (sandbox/live)' },
    { name: 'smsMode', label: 'SMS mode (sandbox/live)' },
    { name: 'defaultSenderName', label: 'Default sender name' },
    { name: 'quietHoursStart', label: 'Quiet hours start', type: 'time' },
    { name: 'quietHoursEnd', label: 'Quiet hours end', type: 'time' },
    { name: 'retryLimit', label: 'Retry limit', type: 'number' },
    { name: 'reminderSchedule', label: 'Reminder schedule' },
    { name: 'emergencyPolicy', label: 'Emergency policy' },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Notification settings"
        description="Provider modes are status-only; secrets remain environment-managed and sandbox adapters remain clearly labelled."
      />
      <Link
        className="font-semibold text-blue-700"
        href="/admin/notifications/templates"
      >
        Manage template activation and versions →
      </Link>
      <Card>
        <SettingsForm
          section="notifications"
          initial={settings.data}
          version={settings.version}
          fields={fields}
          csrfToken={user?.csrfToken ?? ''}
        />
      </Card>
    </div>
  );
}

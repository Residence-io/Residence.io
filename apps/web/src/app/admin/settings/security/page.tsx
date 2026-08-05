import Link from 'next/link';
import { SettingsForm } from '@/components/phase7/settings-form';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
export default async function Page() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    serverApi<{ data: Record<string, unknown>; version: number }>(
      '/settings/sections/security',
    ),
  ]);
  const fields = [
    {
      name: 'sessionDurationMinutes',
      label: 'Session duration (minutes)',
      type: 'number',
    },
    {
      name: 'idleTimeoutMinutes',
      label: 'Idle timeout (minutes)',
      type: 'number',
    },
    {
      name: 'passwordResetMinutes',
      label: 'Password-reset validity (minutes)',
      type: 'number',
    },
    {
      name: 'requireMfaForSuperAdministrators',
      label: 'Require MFA for super administrators',
      type: 'checkbox',
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Security settings"
        description="Safe policy values only; secrets and credential material are rejected by the API."
      />
      <div className="flex gap-4">
        {user?.permissions.includes('ACCESS_ADMIN_MANAGE') ? (
          <Link className="font-semibold text-blue-700" href="/admin/users">
            User accounts →
          </Link>
        ) : null}
        {user?.permissions.includes('ACCESS_ADMIN_MANAGE') ? (
          <Link className="font-semibold text-blue-700" href="/admin/roles">
            Roles and permissions →
          </Link>
        ) : null}
      </div>
      <Card>
        <SettingsForm
          section="security"
          initial={settings.data}
          version={settings.version}
          fields={fields}
          csrfToken={user?.csrfToken ?? ''}
        />
      </Card>
    </div>
  );
}

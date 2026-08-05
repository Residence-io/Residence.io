import { SettingsForm } from '@/components/phase7/settings-form';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
export default async function Page() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    serverApi<{ data: Record<string, unknown>; version: number }>(
      '/settings/sections/residents',
    ),
  ]);
  const fields = [
    { name: 'residentIdFormat', label: 'Resident ID format' },
    {
      name: 'idCardValidityMonths',
      label: 'ID-card validity (months)',
      type: 'number',
    },
    { name: 'idCardLayout', label: 'Supported ID-card layout' },
    {
      name: 'qrVerificationVisible',
      label: 'Enable safe QR verification',
      type: 'checkbox',
    },
    { name: 'blockLabel', label: 'Block naming convention' },
    { name: 'unitLabel', label: 'Unit naming convention' },
    {
      name: 'allowedDocumentTypes',
      label: 'Allowed document types',
      type: 'list',
    },
    {
      name: 'maximumUploadSizeMb',
      label: 'Maximum upload size (MB)',
      type: 'number',
    },
    { name: 'allowedMimeTypes', label: 'Allowed MIME types', type: 'list' },
    { name: 'retentionDays', label: 'Document retention days', type: 'number' },
    {
      name: 'optionalProfileFields',
      label: 'Optional profile fields',
      type: 'list',
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Resident, property, ID-card, and document settings"
        description="Configuration keeps Phase 2 private-storage controls intact."
      />
      <Card>
        <SettingsForm
          section="residents"
          initial={settings.data}
          version={settings.version}
          fields={fields}
          csrfToken={user?.csrfToken ?? ''}
        />
      </Card>
    </div>
  );
}

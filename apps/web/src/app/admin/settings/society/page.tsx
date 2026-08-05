import { SettingsForm } from '@/components/phase7/settings-form';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
export default async function Page() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    serverApi<{ data: Record<string, unknown>; version: number }>(
      '/settings/sections/society',
    ),
  ]);
  const fields = [
    ['name', 'Society name'],
    ['registrationNumber', 'Registration number'],
    ['logoReference', 'Logo reference'],
    ['address', 'Address'],
    ['city', 'City'],
    ['province', 'Province / state'],
    ['country', 'Country'],
    ['postalCode', 'Postal code'],
    ['officialPhone', 'Official phone'],
    ['officialEmail', 'Official email'],
    ['emergencyContact', 'Emergency contact'],
    ['defaultCurrency', 'Default currency'],
    ['locale', 'Locale'],
    ['timeZone', 'Time zone'],
    ['dateFormat', 'Date format'],
    ['financialYearStart', 'Financial year start'],
    ['officeHours', 'Office hours'],
    ['terms', 'Society terms and resident instructions'],
    ['maintenanceMode', 'Maintenance / read-only mode'],
    ['publicCardVerification', 'Public ID-card verification'],
  ].map(([name, label]) => ({
    name,
    label,
    required: ['name', 'defaultCurrency', 'timeZone'].includes(name),
    type: ['maintenanceMode', 'publicCardVerification'].includes(name)
      ? 'checkbox'
      : name === 'officialEmail'
        ? 'email'
        : undefined,
  }));
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Society profile and general settings"
        description="Safe public and operational configuration for this society."
      />
      <Card>
        <SettingsForm
          section="society"
          initial={settings.data}
          version={settings.version}
          fields={fields}
          csrfToken={user?.csrfToken ?? ''}
        />
      </Card>
    </div>
  );
}

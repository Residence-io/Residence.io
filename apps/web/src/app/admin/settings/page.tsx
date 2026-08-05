import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
const areas = [
  ['society', 'Society profile'],
  ['financial', 'Financial settings'],
  ['residents', 'Resident and document settings'],
  ['maintenance', 'Complaint and maintenance settings'],
  ['notifications', 'Notification settings'],
  ['security', 'Security settings'],
] as const;
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Manage versioned society configuration. Sensitive provider credentials remain outside this interface."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {areas.map(([slug, title]) => (
          <Card key={slug}>
            <h2 className="font-bold">{title}</h2>
            <Link
              className="mt-3 inline-block font-semibold text-blue-700"
              href={`/admin/settings/${slug}`}
            >
              Open settings →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
export default async function TemplateDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await serverApi<{
    name: string;
    notificationType: string;
    channel: string;
    versions: Array<{
      id: string;
      versionNumber: number;
      subjectTemplate: string | null;
      messageTemplate: string;
    }>;
  }>(`/notifications/templates/${id}`);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Template"
        title="Template version history"
        description="Published content remains immutable for delivery traceability."
      />
      <Card>
        <p className="font-semibold">{template.name}</p>
        <p className="text-sm text-slate-500">
          {template.notificationType} · {template.channel}
        </p>
        <div className="mt-4 divide-y">
          {template.versions.map((version) => (
            <div className="py-3" key={version.id}>
              <p className="font-semibold">Version {version.versionNumber}</p>
              <p>{version.subjectTemplate}</p>
              <p className="whitespace-pre-wrap text-sm text-slate-600">
                {version.messageTemplate}
              </p>
            </div>
          ))}
        </div>
        <Link
          className="mt-4 inline-block font-semibold text-blue-700"
          href="/admin/notifications/templates"
        >
          Back to templates
        </Link>
      </Card>
    </div>
  );
}

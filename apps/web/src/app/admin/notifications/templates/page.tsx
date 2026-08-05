import { fetchNotificationTemplates } from '@/lib/supabase-data.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

import type { TemplatePage } from '@/lib/notification-types';
export default async function TemplatesPage() {
  const data = await fetchNotificationTemplates();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Communications"
        title="Templates"
        description="Published versions are immutable and preserved with historical notifications."
      />
      <Card>
        {((data as any).items || []).length ? (
          <div className="divide-y">
            {((data as any).items || []).map((item: any) => (
              <div className="py-4" key={item.id}>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.notificationType} · {item.channel} · version{' '}
                  {item.publishedVersion}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No templates have been published.</p>
        )}
      </Card>
    </div>
  );
}

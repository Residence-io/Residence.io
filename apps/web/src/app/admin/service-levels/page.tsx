import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ServiceLevelForm } from '@/components/tickets/ticket-actions';
import { getCurrentUser, serverApi } from '@/lib/api.server';
export default async function Levels() {
  const [items, user] = await Promise.all([
    serverApi<
      Array<{
        id: string;
        ticketType: string;
        priority: string;
        responseMinutes: number;
        resolutionMinutes: number;
      }>
    >('/tickets/service-levels'),
    getCurrentUser(),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="SLA"
        title="Service levels"
        description="Response, resolution, and escalation targets."
      />
      {user && (
        <Card>
          <ServiceLevelForm csrfToken={user.csrfToken} />
        </Card>
      )}
      <Card>
        {items.map((i: any) => (
          <p className="border-b py-3" key={i.id}>
            {i.ticketType} · {i.priority} · response {i.responseMinutes} min ·
            resolution {i.resolutionMinutes} min
          </p>
        ))}
      </Card>
    </div>
  );
}

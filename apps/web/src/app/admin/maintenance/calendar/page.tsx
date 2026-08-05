import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { TicketPage } from '@/lib/ticket-types';
export default async function Calendar() {
  const result = await serverApi<TicketPage>(
    '/tickets/maintenance?status=VISIT_SCHEDULED&pageSize=100',
  );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Scheduling"
        title="Maintenance calendar"
        description="Confirmed visits from real maintenance requests."
      />
      <Card>
        {result.items.map((t) => (
          <p className="border-b py-3" key={t.id}>
            {t.ticketNumber} — {t.subject}
          </p>
        ))}
      </Card>
    </div>
  );
}

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { TicketPage } from '@/lib/ticket-types';
export default async function Unassigned() {
  const result = await serverApi<TicketPage>(
    '/tickets/maintenance?status=APPROVED&pageSize=100',
  );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Triage"
        title="Unassigned maintenance"
        description="Approved requests awaiting an eligible worker."
      />
      <Card>
        {result.items.map((t) => (
          <a
            className="block border-b py-3 text-blue-700"
            href={`/admin/maintenance/${t.id}`}
            key={t.id}
          >
            {t.ticketNumber} — {t.subject}
          </a>
        ))}
      </Card>
    </div>
  );
}

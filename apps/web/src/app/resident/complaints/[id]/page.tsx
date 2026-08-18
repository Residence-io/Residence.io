import { serverApi } from '@/lib/api.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  TicketMessageForm,
  TicketTransitionForm,
} from '@/components/tickets/ticket-actions';
import { getCurrentUser } from '@/lib/api.server';
import type { TicketDetail } from '@/lib/ticket-types';
export default async function Complaint({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, user] = await Promise.all([
    serverApi<TicketDetail>(`/tickets/complaint/${id}`),
    getCurrentUser(),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={ticket.ticketNumber}
        title={ticket.subject}
        description={`${ticket.status} · ${ticket.priority}`}
      />
      <Card>
        <p className="whitespace-pre-wrap">{ticket.description}</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Timeline</h2>
        {ticket.statusHistory?.map((e: any) => (
          <p className="border-l-2 py-2 pl-3 text-sm" key={e.id}>
            {e.toStatus} · {new Date(e.createdAt).toLocaleString()}
            <br />
            {e.residentExplanation}
          </p>
        ))}
      </Card>
      {user && (
        <>
          <Card>
            <TicketMessageForm
              csrfToken={user.csrfToken}
              type="complaint"
              id={id}
            />
          </Card>
          {['RESOLVED', 'REJECTED', 'CLOSED'].includes(ticket.status) && (
            <Card>
              <TicketTransitionForm
                csrfToken={user.csrfToken}
                type="complaint"
                id={id}
                version={ticket.version}
                statuses={['REOPENED', 'CLOSED']}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

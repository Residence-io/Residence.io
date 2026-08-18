import { serverApi } from '@/lib/api.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  RatingForm,
  TicketMessageForm,
  TicketTransitionForm,
} from '@/components/tickets/ticket-actions';
import { getCurrentUser } from '@/lib/api.server';
import type { TicketDetail } from '@/lib/ticket-types';
export default async function Maintenance({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, user] = await Promise.all([
    serverApi<TicketDetail>(`/tickets/maintenance/${id}`),
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
        <p className="mt-2 text-sm text-slate-500">{ticket.exactLocation}</p>
      </Card>
      {ticket.assignments?.length ? (
        <Card>
          <h2 className="font-semibold">Assigned service worker</h2>
          {ticket.assignments?.map((a: any) => (
            <p className="mt-2" key={a.id}>
              {a.worker.fullName} · {a.worker.primaryCategory.name}
            </p>
          ))}
        </Card>
      ) : null}
      {ticket.appointments?.length ? (
        <Card>
          <h2 className="font-semibold">Appointments</h2>
          {ticket.appointments?.map((a: any) => (
            <p className="mt-2" key={a.id}>
              {new Date(a.startsAt).toLocaleString()} · {a.status}
            </p>
          ))}
        </Card>
      ) : null}
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
              type="maintenance"
              id={id}
            />
          </Card>
          {['COMPLETED', 'CLOSED'].includes(ticket.status) &&
            !ticket.rating && (
              <Card>
                <RatingForm csrfToken={user.csrfToken} id={id} />
              </Card>
            )}
          {['COMPLETED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(
            ticket.status,
          ) && (
            <Card>
              <TicketTransitionForm
                csrfToken={user.csrfToken}
                type="maintenance"
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

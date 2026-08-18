import { serverApi } from '@/lib/api.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  MaintenanceOperations,
  TicketMessageForm,
  TicketTransitionForm,
} from '@/components/tickets/ticket-actions';
import { getCurrentUser } from '@/lib/api.server';
export default async function MaintenanceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, user] = await Promise.all([
    serverApi<any>(`/tickets/maintenance/${id}`),
    getCurrentUser(),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={ticket.ticketNumber}
        title={ticket.subject}
        description={`${ticket.status} · ${ticket.priority} · ${ticket.category.name}`}
      />
      <Card>
        <p className="whitespace-pre-wrap">{ticket.description}</p>
        <p className="mt-2 text-sm text-slate-500">{ticket.exactLocation}</p>
      </Card>
      {user && (
        <Card>
          <MaintenanceOperations csrfToken={user.csrfToken} id={id} />
        </Card>
      )}
      <Card>
        <h2 className="font-semibold">Assignments and appointments</h2>
        {ticket.assignments?.map((a: any) => (
          <p className="mt-2 text-sm" key={a.id}>
            {a.worker.workerNumber} — {a.worker.fullName} · {a.status}
          </p>
        ))}
        {ticket.appointments?.map((a: any) => (
          <p className="mt-2 text-sm" key={a.id}>
            {new Date(a.startsAt).toLocaleString()} · {a.status}
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
              admin
            />
          </Card>
          <Card>
            <TicketTransitionForm
              csrfToken={user.csrfToken}
              type="maintenance"
              id={id}
              version={ticket.version}
              statuses={[
                'UNDER_REVIEW',
                'APPROVED',
                'ASSIGNED',
                'VISIT_SCHEDULED',
                'WORK_IN_PROGRESS',
                'AWAITING_PARTS',
                'WAITING_FOR_RESIDENT',
                'COMPLETED',
                'CANCELLED',
                'REJECTED',
                'REOPENED',
                'CLOSED',
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}

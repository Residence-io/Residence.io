'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api-client';
import type { TicketCategory } from '@/lib/ticket-types';

const input = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm';
function useTicketAction(csrfToken: string) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(path: string, body: unknown) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        id?: string;
      };
      if (!response.ok)
        throw new Error(result.message ?? 'Action could not be completed.');
      setMessage('Action completed.');
      router.refresh();
      return result;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Action could not be completed.',
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { submit, message, busy };
}

export function TicketSubmissionForm({
  csrfToken,
  type,
  categories,
}: {
  csrfToken: string;
  type: 'complaint' | 'maintenance';
  categories: TicketCategory[];
}) {
  const action = useTicketAction(csrfToken);
  const router = useRouter();
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const d = new FormData(event.currentTarget);
        const body =
          type === 'complaint'
            ? {
                categoryId: d.get('categoryId'),
                subject: d.get('subject'),
                description: d.get('description'),
                location: d.get('location') || undefined,
                urgency: d.get('urgency'),
                privacy: d.get('privacy'),
                preferredContactMethod: d.get('preferredContactMethod'),
              }
            : {
                categoryId: d.get('categoryId'),
                subject: d.get('subject'),
                description: d.get('description'),
                exactLocation: d.get('exactLocation'),
                preferredVisitDate: d.get('preferredVisitDate') || undefined,
                accessInstructions: d.get('accessInstructions') || undefined,
                urgency: d.get('urgency'),
                preferredContactMethod: d.get('preferredContactMethod'),
                contactDisclosureConsent:
                  d.get('contactDisclosureConsent') === 'on',
              };
        void action
          .submit(
            `/tickets/${type === 'complaint' ? 'complaints' : 'maintenance'}`,
            body,
          )
          .then((result) => {
            if (result?.id)
              router.push(
                `/resident/${type === 'complaint' ? 'complaints' : 'maintenance'}/${result.id}`,
              );
          });
      }}
    >
      <select className={input} name="categoryId" required>
        {categories
          .filter((c) => c.active)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select>
      <input className={input} name="subject" placeholder="Subject" required />
      <textarea
        className={`${input} md:col-span-2`}
        name="description"
        minLength={10}
        placeholder="Describe the issue"
        required
      />
      {type === 'complaint' ? (
        <>
          <input
            className={input}
            name="location"
            placeholder="Location or affected area"
          />
          <select className={input} name="privacy">
            <option>STANDARD</option>
            <option>RESTRICTED</option>
            <option>CONFIDENTIAL</option>
          </select>
        </>
      ) : (
        <>
          <input
            className={input}
            name="exactLocation"
            placeholder="Exact location"
            required
          />
          <input className={input} name="preferredVisitDate" type="date" />
          <input
            className={input}
            name="accessInstructions"
            placeholder="Access instructions"
          />
          <label className="flex items-center gap-2 text-sm">
            <input name="contactDisclosureConsent" type="checkbox" />
            Allow necessary contact sharing after assignment
          </label>
        </>
      )}
      <select className={input} name="urgency">
        <option>LOW</option>
        <option>NORMAL</option>
        <option>HIGH</option>
        <option>URGENT</option>
        <option>EMERGENCY</option>
      </select>
      <select className={input} name="preferredContactMethod">
        <option>IN_APP</option>
        <option>PHONE</option>
        <option>EMAIL</option>
      </select>
      <Button disabled={action.busy}>Submit {type}</Button>
      {action.message && <p className="text-sm">{action.message}</p>}
    </form>
  );
}

export function TicketMessageForm({
  csrfToken,
  type,
  id,
  admin = false,
}: {
  csrfToken: string;
  type: 'complaint' | 'maintenance';
  id: string;
  admin?: boolean;
}) {
  const action = useTicketAction(csrfToken);
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const d = new FormData(event.currentTarget);
        void action.submit(`/tickets/${type}/${id}/messages`, {
          body: d.get('body'),
          visibility: d.get('visibility'),
        });
      }}
    >
      <textarea
        className={input}
        name="body"
        placeholder="Add a message"
        required
      />
      {admin && (
        <select className={input} name="visibility">
          <option>RESIDENT_VISIBLE</option>
          <option>INTERNAL</option>
          <option>WORKER_OPERATIONAL</option>
        </select>
      )}
      {!admin && (
        <input name="visibility" type="hidden" value="RESIDENT_VISIBLE" />
      )}
      <Button disabled={action.busy}>Add message</Button>
      {action.message && <p className="text-sm">{action.message}</p>}
    </form>
  );
}

export function TicketTransitionForm({
  csrfToken,
  type,
  id,
  version,
  statuses,
}: {
  csrfToken: string;
  type: 'complaint' | 'maintenance';
  id: string;
  version: number;
  statuses: string[];
}) {
  const action = useTicketAction(csrfToken);
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const d = new FormData(event.currentTarget);
        const status = String(d.get('status'));
        if (!window.confirm(`Confirm transition to ${status}?`)) return;
        void action.submit(`/tickets/${type}/${id}/status/${status}`, {
          reason: d.get('reason'),
          residentExplanation: d.get('residentExplanation') || undefined,
          version,
        });
      }}
    >
      <select className={input} name="status">
        {statuses.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <input
        className={input}
        name="reason"
        placeholder="Required reason"
        required
      />
      <input
        className={`${input} sm:col-span-2`}
        name="residentExplanation"
        placeholder="Resident-visible explanation"
      />
      <Button disabled={action.busy}>Change status</Button>
      {action.message && <p className="text-sm">{action.message}</p>}
    </form>
  );
}

export function MaintenanceOperations({
  csrfToken,
  id,
}: {
  csrfToken: string;
  id: string;
}) {
  const action = useTicketAction(csrfToken);
  const [workers, setWorkers] = useState<
    Array<{ id: string; workerNumber: string; fullName: string }>
  >([]);
  return (
    <div className="space-y-5">
      <form
        className="grid gap-2 sm:grid-cols-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const d = new FormData(event.currentTarget);
          const startsAt = new Date(String(d.get('startsAt'))).toISOString();
          const endsAt = new Date(String(d.get('endsAt'))).toISOString();
          const response = await fetch(
            `${API_URL}/tickets/maintenance/${id}/eligible?startsAt=${encodeURIComponent(startsAt)}&endsAt=${encodeURIComponent(endsAt)}`,
            { credentials: 'include' },
          );
          setWorkers(response.ok ? await response.json() : []);
        }}
      >
        <input
          className={input}
          name="startsAt"
          type="datetime-local"
          required
        />
        <input className={input} name="endsAt" type="datetime-local" required />
        <Button>Find eligible workers</Button>
      </form>
      <form
        className="grid gap-2 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          const d = new FormData(event.currentTarget);
          void action.submit(`/tickets/maintenance/${id}/assignments`, {
            workerId: d.get('workerId'),
            startsAt: new Date(String(d.get('startsAt'))).toISOString(),
            endsAt: new Date(String(d.get('endsAt'))).toISOString(),
            reason: d.get('reason'),
          });
        }}
      >
        <select className={input} name="workerId" required>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.workerNumber} — {w.fullName}
            </option>
          ))}
        </select>
        <input
          className={input}
          name="startsAt"
          type="datetime-local"
          required
        />
        <input className={input} name="endsAt" type="datetime-local" required />
        <input
          className={input}
          name="reason"
          placeholder="Assignment reason"
          required
        />
        <Button disabled={action.busy}>Assign worker</Button>
      </form>
      <form
        className="grid gap-2 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          const d = new FormData(event.currentTarget);
          void action.submit(`/tickets/maintenance/${id}/appointments`, {
            startsAt: new Date(String(d.get('startsAt'))).toISOString(),
            endsAt: new Date(String(d.get('endsAt'))).toISOString(),
            accessInstructions: d.get('accessInstructions') || undefined,
            reason: d.get('reason') || undefined,
          });
        }}
      >
        <input
          className={input}
          name="startsAt"
          type="datetime-local"
          required
        />
        <input className={input} name="endsAt" type="datetime-local" required />
        <input
          className={input}
          name="accessInstructions"
          placeholder="Access instructions"
        />
        <input
          className={input}
          name="reason"
          placeholder="Scheduling reason"
        />
        <Button disabled={action.busy}>Schedule appointment</Button>
      </form>
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const d = new FormData(event.currentTarget);
          void action.submit(`/tickets/maintenance/${id}/resolution`, {
            workPerformed: d.get('workPerformed'),
            residentSummary: d.get('residentSummary'),
            partsNotes: d.get('partsNotes') || undefined,
            internalNotes: d.get('internalNotes') || undefined,
          });
        }}
      >
        <textarea
          className={input}
          name="workPerformed"
          placeholder="Work performed"
          required
        />
        <textarea
          className={input}
          name="residentSummary"
          placeholder="Resident-visible resolution"
          required
        />
        <input
          className={input}
          name="partsNotes"
          placeholder="Parts or materials"
        />
        <input
          className={input}
          name="internalNotes"
          placeholder="Internal notes"
        />
        <Button disabled={action.busy}>Record resolution</Button>
      </form>
      {action.message && <p className="text-sm">{action.message}</p>}
    </div>
  );
}

export function RatingForm({
  csrfToken,
  id,
}: {
  csrfToken: string;
  id: string;
}) {
  const action = useTicketAction(csrfToken);
  return (
    <form
      className="grid gap-2 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const d = new FormData(event.currentTarget);
        void action.submit(`/tickets/maintenance/${id}/rating`, {
          overall: Number(d.get('overall')),
          serviceQuality: Number(d.get('serviceQuality')),
          timeliness: Number(d.get('timeliness')),
          professionalBehaviour: Number(d.get('professionalBehaviour')),
          comments: d.get('comments') || undefined,
        });
      }}
    >
      {['overall', 'serviceQuality', 'timeliness', 'professionalBehaviour'].map(
        (name) => (
          <select className={input} key={name} name={name}>
            <option value="5">5 — Excellent</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        ),
      )}
      <input
        className={`${input} sm:col-span-2`}
        name="comments"
        placeholder="Optional comments"
      />
      <Button disabled={action.busy}>Submit rating</Button>
      {action.message && <p>{action.message}</p>}
    </form>
  );
}

export function CategoryForm({
  csrfToken,
  type,
}: {
  csrfToken: string;
  type: 'complaint' | 'maintenance';
}) {
  const action = useTicketAction(csrfToken);
  return (
    <form
      className="flex flex-wrap gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const d = new FormData(event.currentTarget);
        void action.submit(`/tickets/categories/${type}`, {
          name: d.get('name'),
          description: d.get('description') || undefined,
        });
      }}
    >
      <input
        className={input}
        name="name"
        placeholder="Category name"
        required
      />
      <input className={input} name="description" placeholder="Description" />
      <Button disabled={action.busy}>Create category</Button>
      {action.message && <span>{action.message}</span>}
    </form>
  );
}

export function ServiceLevelForm({ csrfToken }: { csrfToken: string }) {
  const action = useTicketAction(csrfToken);
  return (
    <form
      className="grid gap-2 sm:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const d = new FormData(event.currentTarget);
        void action.submit('/tickets/service-levels', {
          ticketType: d.get('ticketType'),
          priority: d.get('priority'),
          responseMinutes: Number(d.get('responseMinutes')),
          resolutionMinutes: Number(d.get('resolutionMinutes')),
          escalationRoleCode: d.get('escalationRoleCode'),
        });
      }}
    >
      <select className={input} name="ticketType">
        <option>COMPLAINT</option>
        <option>MAINTENANCE</option>
      </select>
      <select className={input} name="priority">
        <option>LOW</option>
        <option>NORMAL</option>
        <option>HIGH</option>
        <option>URGENT</option>
        <option>EMERGENCY</option>
      </select>
      <input
        className={input}
        name="responseMinutes"
        type="number"
        min="1"
        placeholder="Response minutes"
        required
      />
      <input
        className={input}
        name="resolutionMinutes"
        type="number"
        min="1"
        placeholder="Resolution minutes"
        required
      />
      <input
        className={input}
        name="escalationRoleCode"
        defaultValue="ADMINISTRATOR"
        required
      />
      <Button disabled={action.busy}>Create SLA policy</Button>
      {action.message && <span>{action.message}</span>}
    </form>
  );
}

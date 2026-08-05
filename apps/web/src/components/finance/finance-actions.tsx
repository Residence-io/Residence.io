'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
function useSubmit(csrfToken: string) {
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
      };
      if (!response.ok)
        throw new Error(result.message ?? 'The action could not be completed.');
      setMessage('Action completed.');
      router.refresh();
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The action could not be completed.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { submit, message, busy };
}
const input = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm';
export function FeePlanForm({ csrfToken }: { csrfToken: string }) {
  const action = useSubmit(csrfToken);
  return (
    <form
      className="grid gap-3 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void action.submit('/fee-plans', {
          name: data.get('name'),
          scope: 'SOCIETY_DEFAULT',
          monthlyBaseAmount: data.get('amount'),
          currency: data.get('currency'),
          effectiveFrom: data.get('effectiveFrom'),
          dueDay: Number(data.get('dueDay')),
          gracePeriodDays: Number(data.get('grace')),
          lateFeeType: data.get('lateFeeType'),
          lateFeeValue: data.get('lateFeeValue'),
          lateFeeRecurring: false,
        });
      }}
    >
      <input className={input} name="name" placeholder="Plan name" required />
      <input
        className={input}
        name="amount"
        placeholder="Monthly amount"
        pattern="\d+(\.\d{1,2})?"
        required
      />
      <input
        className={input}
        name="currency"
        defaultValue="PKR"
        maxLength={3}
        required
      />
      <input className={input} name="effectiveFrom" type="date" required />
      <input
        className={input}
        name="dueDay"
        type="number"
        min="1"
        max="28"
        defaultValue="10"
        required
      />
      <input
        className={input}
        name="grace"
        type="number"
        min="0"
        max="60"
        defaultValue="0"
        required
      />
      <select className={input} name="lateFeeType">
        <option value="NONE">No late fee</option>
        <option value="FIXED">Fixed</option>
        <option value="PERCENTAGE">Percentage</option>
      </select>
      <input className={input} name="lateFeeValue" defaultValue="0" required />
      <Button disabled={action.busy}>Create fee plan</Button>
      {action.message && (
        <p className="text-sm md:col-span-3" role="status">
          {action.message}
        </p>
      )}
    </form>
  );
}
export function DuesGenerator({ csrfToken }: { csrfToken: string }) {
  const action = useSubmit(csrfToken);
  const now = new Date();
  return (
    <form
      className="flex flex-wrap gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void action.submit('/dues/generate', {
          year: Number(data.get('year')),
          month: Number(data.get('month')),
          idempotencyKey: crypto.randomUUID(),
        });
      }}
    >
      <input
        className={input}
        name="year"
        type="number"
        defaultValue={now.getFullYear()}
      />
      <input
        className={input}
        name="month"
        type="number"
        min="1"
        max="12"
        defaultValue={now.getMonth() + 1}
      />
      <Button disabled={action.busy}>Generate dues</Button>
      {action.message && (
        <p className="w-full text-sm" role="status">
          {action.message}
        </p>
      )}
    </form>
  );
}
export function PaymentForm({
  csrfToken,
  residentId,
  residentMode = false,
}: {
  csrfToken: string;
  residentId?: string;
  residentMode?: boolean;
}) {
  const action = useSubmit(csrfToken);
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void action.submit(residentMode ? '/payments/me' : '/payments', {
          ...(residentMode ? {} : { residentId: data.get('residentId') }),
          amount: data.get('amount'),
          currency: data.get('currency'),
          method: data.get('method'),
          allocationStrategy: data.get('allocationStrategy'),
          transactionReference: data.get('reference') || undefined,
          idempotencyKey: crypto.randomUUID(),
        });
      }}
    >
      {!residentMode && (
        <input
          className={input}
          name="residentId"
          defaultValue={residentId}
          placeholder="Resident UUID"
          required
        />
      )}
      <input className={input} name="amount" placeholder="Amount" required />
      <input className={input} name="currency" defaultValue="PKR" required />
      <select className={input} name="method">
        {residentMode ? (
          <>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="CARD_PROVIDER">Online provider</option>
            <option value="DIGITAL_WALLET">Digital wallet</option>
          </>
        ) : (
          <>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="OTHER">Other</option>
          </>
        )}
      </select>
      <select className={input} name="allocationStrategy">
        <option value="OLDEST_DUE_FIRST">Oldest due first</option>
        <option value="ALL_OUTSTANDING">All outstanding</option>
        <option value="CURRENT_MONTH">Current month</option>
        <option value="ADVANCE">Advance credit</option>
      </select>
      {!residentMode && (
        <input
          className={input}
          name="reference"
          placeholder="Transaction reference"
        />
      )}
      <Button disabled={action.busy}>
        {residentMode ? 'Initiate payment' : 'Record payment'}
      </Button>
      {action.message && (
        <p className="text-sm sm:col-span-2" role="status">
          {action.message}
        </p>
      )}
    </form>
  );
}
export function PaymentDecisionActions({
  csrfToken,
  paymentId,
}: {
  csrfToken: string;
  paymentId: string;
}) {
  const action = useSubmit(csrfToken);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        disabled={action.busy}
        onClick={() => void action.submit(`/payments/${paymentId}/verify`, {})}
      >
        Verify payment
      </Button>
      <Button
        disabled={action.busy}
        onClick={() => {
          const reason = window.prompt('Rejection reason');
          if (reason)
            void action.submit(`/payments/${paymentId}/reject`, {
              reason,
              idempotencyKey: crypto.randomUUID(),
            });
        }}
      >
        Reject
      </Button>
      <Button
        disabled={action.busy}
        onClick={() => {
          const reason = window.prompt('Reversal reason');
          if (reason && window.confirm('Reverse this confirmed payment?'))
            void action.submit(`/payments/${paymentId}/reverse`, {
              reason,
              idempotencyKey: crypto.randomUUID(),
            });
        }}
      >
        Reverse
      </Button>
      {action.message && (
        <p className="w-full text-sm" role="status">
          {action.message}
        </p>
      )}
    </div>
  );
}

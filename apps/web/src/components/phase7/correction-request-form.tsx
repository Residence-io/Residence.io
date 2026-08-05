'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/states';
export function CorrectionRequestForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/profile/me/correction-requests`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({
        requestType: form.get('requestType'),
        requestedChanges: { requestedValue: form.get('requestedValue') },
        reason: form.get('reason'),
      }),
    });
    setMessage(
      response.ok
        ? 'Correction request submitted.'
        : 'The request could not be submitted.',
    );
    if (response.ok) {
      event.currentTarget.reset();
      router.refresh();
    }
  }
  return (
    <form className="mt-4 space-y-3" onSubmit={submit}>
      {message ? (
        <Alert tone={message.startsWith('Correction') ? 'success' : 'error'}>
          {message}
        </Alert>
      ) : null}
      <select
        name="requestType"
        className="min-h-11 rounded-xl border border-slate-300 px-3"
        aria-label="Correction type"
      >
        <option>IDENTITY</option>
        <option>TENANCY</option>
        <option>OCCUPANCY</option>
        <option>OTHER</option>
      </select>
      <Input
        name="requestedValue"
        placeholder="Requested corrected information"
        required
      />
      <Input
        name="reason"
        placeholder="Why this correction is needed"
        minLength={10}
        required
      />
      <Button>Submit correction request</Button>
    </form>
  );
}

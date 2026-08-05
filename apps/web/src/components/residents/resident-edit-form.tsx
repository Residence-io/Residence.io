'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import type { ResidentDetail } from '@/lib/resident-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
const field = 'w-full rounded-xl border border-slate-300 px-3 py-2';
export function ResidentEditForm({
  resident,
  csrfToken,
}: {
  resident: ResidentDetail;
  csrfToken: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const body = {
      version: resident.version,
      fullName: form.get('fullName'),
      guardianName: form.get('guardianName') || undefined,
      email: form.get('email') || undefined,
      primaryPhone: form.get('primaryPhone'),
      alternatePhone: form.get('alternatePhone') || undefined,
      permanentAddress: form.get('permanentAddress') || undefined,
      emergencyContactName: form.get('emergencyContactName') || undefined,
      emergencyContactPhone: form.get('emergencyContactPhone') || undefined,
    };
    try {
      const response = await fetch(`${API_URL}/residents/${resident.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? 'Update failed.');
      router.push(`/admin/residents/${resident.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Update failed.');
      setBusy(false);
    }
  }
  return (
    <Card>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        {error && (
          <p className="md:col-span-2 text-red-700" role="alert">
            {error}
          </p>
        )}
        <label>
          Full name
          <input
            className={field}
            name="fullName"
            defaultValue={resident.fullName}
            required
          />
        </label>
        <label>
          Guardian name
          <input
            className={field}
            name="guardianName"
            defaultValue={resident.guardianName}
          />
        </label>
        <label>
          Email
          <input
            className={field}
            name="email"
            type="email"
            defaultValue={resident.email}
          />
        </label>
        <label>
          Primary phone
          <input
            className={field}
            name="primaryPhone"
            defaultValue={resident.primaryPhone}
            required
          />
        </label>
        <label>
          Alternate phone
          <input
            className={field}
            name="alternatePhone"
            defaultValue={resident.alternatePhone}
          />
        </label>
        <label>
          Emergency contact
          <input
            className={field}
            name="emergencyContactName"
            defaultValue={resident.emergencyContactName}
          />
        </label>
        <label>
          Emergency phone
          <input
            className={field}
            name="emergencyContactPhone"
            defaultValue={resident.emergencyContactPhone}
          />
        </label>
        <label className="md:col-span-2">
          Permanent address
          <textarea
            className={field}
            name="permanentAddress"
            defaultValue={resident.permanentAddress}
          />
        </label>
        <Button className="md:col-span-2" disabled={busy}>
          {busy ? 'Saving…' : 'Save approved fields'}
        </Button>
      </form>
    </Card>
  );
}

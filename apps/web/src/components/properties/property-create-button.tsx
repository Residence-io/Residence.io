'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

const field =
  'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2';

export function PropertyCreateButton({ csrfToken }: { csrfToken: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          block: form.get('block'),
          street: form.get('street') || undefined,
          propertyNumber: form.get('propertyNumber'),
          type: form.get('type'),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
      };
      if (!response.ok || !result.id)
        throw new Error(result.message ?? 'Unable to create property.');
      setOpen(false);
      router.push(`/admin/properties/${result.id}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to create property.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button">
        Add Property
      </Button>
      {open && (
        <div
          aria-labelledby="add-property-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
        >
          <form
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={submit}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold" id="add-property-title">
                Add Property
              </h2>
              <button
                aria-label="Close"
                className="text-2xl text-slate-600"
                disabled={busy}
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            {error && (
              <p className="mt-4 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                Block
                <input className={field} name="block" required maxLength={80} />
              </label>
              <label>
                Property Number
                <input
                  className={field}
                  name="propertyNumber"
                  required
                  maxLength={80}
                />
              </label>
              <label>
                Property Type
                <select className={field} name="type" defaultValue="HOUSE">
                  <option value="HOUSE">House</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="PLOT">Plot</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label>
                Street
                <input className={field} name="street" maxLength={160} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                disabled={busy}
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button disabled={busy} type="submit">
                {busy ? 'Adding…' : 'Add Property'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

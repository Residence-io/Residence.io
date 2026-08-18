'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

const field =
  'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2';

export function ResidentRelatedAddButton({
  csrfToken,
  kind,
  residentId,
}: {
  csrfToken: string;
  kind: 'member' | 'vehicle';
  residentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const member = kind === 'member';
  const label = member ? 'household member' : 'vehicle';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const body = member
      ? {
          fullName: form.get('fullName'),
          relationship: form.get('relationship'),
          age: Number(form.get('age')),
          phone: form.get('phone'),
        }
      : {
          type: form.get('type'),
          name: form.get('vehicleName'),
          registrationNumber: form.get('numberPlate'),
        };
    try {
      const response = await fetch(
        `${API_URL}/residents/${residentId}/${
          member ? 'household-members' : 'vehicles'
        }`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok)
        throw new Error(result.message ?? `Unable to add ${label}.`);
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : `Unable to add ${label}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        aria-label={`Add ${label}`}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-2xl font-medium leading-none text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        onClick={() => {
          setError('');
          setOpen(true);
        }}
        title={`Add ${label}`}
        type="button"
      >
        +
      </button>

      {open && (
        <div
          aria-labelledby={`add-${kind}-title`}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
        >
          <form
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={submit}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold" id={`add-${kind}-title`}>
                Add {label}
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
              {member ? (
                <>
                  <label className="sm:col-span-2">
                    Full name
                    <input
                      className={field}
                      maxLength={160}
                      minLength={2}
                      name="fullName"
                      required
                    />
                  </label>
                  <label>
                    Relationship
                    <select className={field} name="relationship" required>
                      <option value="">Select relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label>
                    Age
                    <input
                      className={field}
                      max={120}
                      min={1}
                      name="age"
                      required
                      type="number"
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      className={field}
                      name="phone"
                      pattern={'\\+?[0-9][0-9 ()-]{6,24}'}
                      required
                      type="tel"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Vehicle type
                    <select className={field} name="type">
                      <option value="CAR">Car</option>
                      <option value="BIKE">Bike</option>
                    </select>
                  </label>
                  <label>
                    Vehicle number plate
                    <input
                      className={field}
                      maxLength={20}
                      minLength={3}
                      name="numberPlate"
                      pattern="[A-Za-z0-9][A-Za-z0-9 -]{2,19}"
                      required
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Vehicle name
                    <input
                      className={field}
                      maxLength={100}
                      name="vehicleName"
                      required
                    />
                  </label>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                className="bg-slate-600 hover:bg-slate-700"
                disabled={busy}
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button disabled={busy}>
                {busy ? 'Adding…' : `Add ${label}`}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

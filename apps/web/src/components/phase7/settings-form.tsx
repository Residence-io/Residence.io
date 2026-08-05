'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/states';

type Field = { name: string; label: string; type?: string; required?: boolean };
export function SettingsForm({
  section,
  initial,
  version,
  fields,
  csrfToken,
}: {
  section: string;
  initial: Record<string, unknown>;
  version: number;
  fields: Field[];
  csrfToken: string;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(
      fields.map((field) => {
        const value = String(form.get(field.name) ?? '');
        if (field.type === 'number') return [field.name, Number(value)];
        if (field.type === 'checkbox')
          return [field.name, form.get(field.name) === 'on'];
        if (field.type === 'list')
          return [
            field.name,
            value
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
          ];
        return [field.name, value];
      }),
    );
    const response = await fetch(`${API_URL}/settings/sections/${section}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({ data, version }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(body?.message ?? 'Settings could not be saved.');
      setBusy(false);
      return;
    }
    setSaved(true);
    setBusy(false);
    router.refresh();
  }
  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? <Alert>{error}</Alert> : null}
      {saved ? <Alert tone="success">Settings saved and audited.</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) =>
          field.type === 'checkbox' ? (
            <label
              key={field.name}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold"
            >
              <input
                defaultChecked={initial[field.name] === true}
                name={field.name}
                type="checkbox"
              />
              {field.label}
            </label>
          ) : (
            <FormField
              key={field.name}
              label={field.label}
              htmlFor={field.name}
            >
              <Input
                id={field.name}
                name={field.name}
                type={
                  field.type === 'number'
                    ? 'number'
                    : field.type === 'email'
                      ? 'email'
                      : field.type === 'time'
                        ? 'time'
                        : 'text'
                }
                defaultValue={
                  Array.isArray(initial[field.name])
                    ? (initial[field.name] as unknown[]).join(', ')
                    : String(initial[field.name] ?? '')
                }
                required={field.required}
              />
            </FormField>
          ),
        )}
      </div>
      <Button disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</Button>
    </form>
  );
}

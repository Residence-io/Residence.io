'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

export type FamilyMember = {
  id: string;
  fullName: string;
  relationship: string;
  age: number | null;
  phone: string | null;
  version: number;
};

const emptyForm = { fullName: '', relationship: '', age: '', phone: '' };
const field =
  'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2';

export function FamilyMemberManager({
  csrfToken,
  initialMembers,
}: {
  csrfToken: string;
  initialMembers: FamilyMember[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [removing, setRemoving] = useState<FamilyMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function request(
    path: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body: Record<string, unknown>,
  ) {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify(body),
    });
    const result = (await response.json().catch(() => ({}))) as
      | FamilyMember
      | { message?: string; removed?: boolean };
    if (!response.ok)
      throw new Error(
        'message' in result && result.message
          ? result.message
          : 'The family member could not be saved.',
      );
    return result as FamilyMember;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const body = {
        fullName: form.fullName.trim(),
        relationship: form.relationship.trim(),
        age: form.age ? Number(form.age) : undefined,
        phone: form.phone.trim() || undefined,
        ...(editing ? { version: editing.version } : {}),
      };
      const saved = await request(
        editing
          ? `/residents/me/household-members/${editing.id}`
          : '/residents/me/household-members',
        editing ? 'PATCH' : 'POST',
        body,
      );
      setMembers((current) =>
        editing
          ? current.map((member) => (member.id === saved.id ? saved : member))
          : [...current, saved],
      );
      setForm(emptyForm);
      setEditing(null);
      setMessage(
        editing
          ? 'Family member updated successfully.'
          : 'Family member added successfully. You can add another member.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The family member could not be saved.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!removing || busy) return;
    setBusy(true);
    setMessage('');
    try {
      await request(
        `/residents/me/household-members/${removing.id}`,
        'DELETE',
        { version: removing.version },
      );
      setMembers((current) =>
        current.filter((member) => member.id !== removing.id),
      );
      setRemoving(null);
      setMessage('Family member removed successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The family member could not be removed.',
      );
    } finally {
      setBusy(false);
    }
  }

  function edit(member: FamilyMember) {
    setEditing(member);
    setForm({
      fullName: member.fullName,
      relationship: member.relationship,
      age: member.age == null ? '' : String(member.age),
      phone: member.phone ?? '',
    });
    setMessage('');
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          className="rounded-xl bg-blue-50 p-3 text-sm text-blue-950"
          role="status"
        >
          {message}
        </p>
      )}
      <form
        className="rounded-2xl border border-slate-200 p-5"
        onSubmit={submit}
      >
        <h2 className="font-bold">
          {editing ? 'Edit Family Member' : 'Add Family Member'}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            Name
            <input
              className={field}
              name="fullName"
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              minLength={2}
              maxLength={160}
              required
            />
          </label>
          <label>
            Relationship
            <select
              className={field}
              name="relationship"
              value={form.relationship}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  relationship: event.target.value,
                }))
              }
              required
            >
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
              name="age"
              type="number"
              min="1"
              max="120"
              step="1"
              value={form.age}
              onChange={(event) =>
                setForm((current) => ({ ...current, age: event.target.value }))
              }
            />
          </label>
          <label>
            Phone
            <input
              className={field}
              name="phone"
              type="tel"
              inputMode="tel"
              pattern="\+?[0-9][0-9 ()-]{6,29}"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Another Member'}
          </Button>
          {editing && (
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <section>
        <h2 className="font-bold">Your Family Members</h2>
        {!members.length ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            No family members have been added.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {members.map((member) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                key={member.id}
              >
                <div>
                  <p className="font-semibold">{member.fullName}</p>
                  <p className="text-sm text-slate-600">
                    {member.relationship} · Age {member.age ?? 'not recorded'} ·{' '}
                    {member.phone ?? 'No phone'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => edit(member)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => setRemoving(member)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {removing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-family-member-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="remove-family-member-title" className="text-lg font-bold">
              Remove Family Member
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Remove {removing.fullName} from your active family-member list?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                type="button"
                disabled={busy}
                onClick={() => setRemoving(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
              >
                {busy ? 'Removing…' : 'Confirm Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

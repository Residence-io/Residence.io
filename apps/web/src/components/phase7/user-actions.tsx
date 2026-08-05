'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';

export function UserActions({
  id,
  version,
  status,
  csrfToken,
  roles,
  assignedRoleIds,
}: {
  id: string;
  version: number;
  status: string;
  csrfToken: string;
  roles: { id: string; displayName: string }[];
  assignedRoleIds: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  async function action(path: string, body: Record<string, unknown>) {
    const response = await fetch(
      `${API_URL}/administration/users/${id}/${path}`,
      {
        method: ['status', 'roles'].includes(path) ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(result?.message ?? 'Action failed.');
      return;
    }
    router.refresh();
  }
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-sm">
      <button
        className="font-semibold text-blue-700"
        onClick={() =>
          action('status', {
            status: status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
            reason: 'Administrative account review',
            version,
          })
        }
      >
        {status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
      </button>
      <button
        className="font-semibold text-blue-700"
        onClick={() =>
          action('force-password-reset', {
            reason: 'Administrative security action',
          })
        }
      >
        Force password reset
      </button>
      <button
        className="font-semibold text-blue-700"
        onClick={() =>
          action('revoke-sessions', {
            reason: 'Administrative security action',
          })
        }
      >
        Revoke sessions
      </button>
      {error ? <span className="text-red-700">{error}</span> : null}
      <details className="w-full">
        <summary className="cursor-pointer font-semibold text-blue-700">
          Assign roles
        </summary>
        <form
          className="mt-2 flex flex-wrap items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void action('roles', {
              roleIds: roles
                .filter((role) => form.get(role.id) === 'on')
                .map((role) => role.id),
              reason: 'Approved administrative role assignment',
              version,
            });
          }}
        >
          {roles.map((role) => (
            <label key={role.id} className="flex gap-2">
              <input
                type="checkbox"
                name={role.id}
                defaultChecked={assignedRoleIds.includes(role.id)}
              />
              {role.displayName}
            </label>
          ))}
          <button className="font-semibold text-blue-700">Save roles</button>
        </form>
      </details>
    </div>
  );
}

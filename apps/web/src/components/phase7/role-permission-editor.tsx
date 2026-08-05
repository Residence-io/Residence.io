'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

export function RolePermissionEditor({
  roleId,
  version,
  selected,
  permissions,
  csrfToken,
}: {
  roleId: string;
  version: number;
  selected: string[];
  permissions: { id: string; code: string }[];
  csrfToken: string;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const permissionIds = permissions
      .filter((permission) => form.get(permission.id) === 'on')
      .map((permission) => permission.id);
    const response = await fetch(
      `${API_URL}/administration/roles/${roleId}/permissions`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          permissionIds,
          reason: 'Approved role-permission administration update',
          version,
        }),
      },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(body?.message ?? 'Permissions could not be updated.');
      return;
    }
    router.refresh();
  }
  return (
    <details className="mt-4">
      <summary className="cursor-pointer font-semibold text-blue-700">
        Manage permission assignments
      </summary>
      <form className="mt-3 space-y-4" onSubmit={submit}>
        <div className="grid gap-2 md:grid-cols-2">
          {permissions.map((permission) => (
            <label key={permission.id} className="flex gap-2 text-xs">
              <input
                type="checkbox"
                name={permission.id}
                defaultChecked={selected.includes(permission.id)}
              />
              {permission.code}
            </label>
          ))}
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button>Save permission assignments</Button>
      </form>
    </details>
  );
}

import { Card } from '@/components/ui/card';
import { RolePermissionEditor } from '@/components/phase7/role-permission-editor';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser } from '@/lib/api.server';
import { fetchRoles, fetchPermissions } from '@/lib/supabase-data.server';
type Role = {
  id: string;
  code: string;
  displayName: string;
  description?: string;
  active: boolean;
  systemRole: boolean;
  permissions: {
    permission: { id: string; code: string; description: string };
  }[];
  _count: { users: number };
  version: number;
};
type Permission = { id: string; code: string };
export default async function Page() {
  const user = await getCurrentUser();
  const [roles, permissions] = await Promise.all([
    fetchRoles(),
    user?.roles.includes('SUPER_ADMINISTRATOR')
      ? fetchPermissions()
      : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Roles and permissions"
        description="Review society roles and their backend-enforced permissions. Only super administrators may change permission grants."
      />
      {roles.map((role: Role) => (
        <Card key={role.id}>
          <div className="flex justify-between gap-4">
            <div>
              <h2 className="font-bold">{role.displayName}</h2>
              <p className="text-sm text-slate-600">
                {role.description ?? role.code} · {role._count.users} account(s)
              </p>
            </div>
            <span className="text-sm font-semibold">
              {role.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {role.permissions.map(({ permission }: any) => (
              <span
                key={permission.code}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs"
              >
                {permission.code}
              </span>
            ))}
          </div>
          {user?.roles.includes('SUPER_ADMINISTRATOR') ? (
            <RolePermissionEditor
              roleId={role.id}
              version={role.version}
              selected={role.permissions.map(
                ({ permission }: any) => permission.id,
              )}
              permissions={permissions}
              csrfToken={user.csrfToken}
            />
          ) : null}
        </Card>
      ))}
    </div>
  );
}

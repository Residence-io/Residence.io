import { UserActions } from '@/components/phase7/user-actions';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
type UserRow = {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  status: string;
  forcePasswordChange: boolean;
  lastLoginAt?: string;
  version: number;
  roles: { role: { id: string; code: string; displayName: string } }[];
  recentSecurityActivity: {
    action: string;
    outcome: string;
    createdAt: string;
  }[];
};
type Result = { items: UserRow[]; total: number };
type Role = { id: string; displayName: string };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  const [user, result, roles] = await Promise.all([
    getCurrentUser(),
    serverApi<Result>(`/administration/users?${query}`),
    serverApi<Role[]>('/administration/roles'),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="User accounts"
        description={`${result.total} society-scoped accounts. Password hashes and session secrets are never returned.`}
      />
      <form className="flex flex-wrap gap-3">
        <input
          className="min-h-11 rounded-xl border border-slate-300 px-3"
          name="search"
          defaultValue={params.search}
          placeholder="Search name, username, or email"
        />
        <select
          className="min-h-11 rounded-xl border border-slate-300 px-3"
          name="status"
          defaultValue={params.status}
        >
          <option value="">All statuses</option>
          <option>ACTIVE</option>
          <option>SUSPENDED</option>
          <option>DEACTIVATED</option>
        </select>
        <button className="rounded-xl bg-slate-900 px-4 text-white">
          Filter
        </button>
      </form>
      {result.items.length ? (
        result.items.map((account: any) => (
          <Card key={account.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-bold">{account.displayName}</h2>
                <p className="text-sm text-slate-600">
                  {account.username} · {account.email ?? 'No email'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {account.roles
                    .map((entry: any) => entry.role.displayName)
                    .join(', ') || 'No role assigned'}
                </p>
              </div>
              <span className="font-semibold">{account.status}</span>
            </div>
            <UserActions
              id={account.id}
              version={account.version}
              status={account.status}
              csrfToken={user?.csrfToken ?? ''}
              roles={roles}
              assignedRoleIds={account.roles.map(({ role }: any) => role.id)}
            />
            {account.recentSecurityActivity.length ? (
              <p className="mt-3 text-xs text-slate-500">
                Recent security activity:{' '}
                {account.recentSecurityActivity
                  .map((event: any) => event.action)
                  .join(', ')}
              </p>
            ) : null}
          </Card>
        ))
      ) : (
        <EmptyState title="No matching accounts">
          Adjust the filters and try again.
        </EmptyState>
      )}
    </div>
  );
}

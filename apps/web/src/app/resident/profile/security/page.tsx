import Link from 'next/link';
import { ChangePasswordForm } from '@/components/auth/account-form';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';
type Security = {
  username: string;
  email?: string;
  lastLoginAt?: string;
  passwordChangedAt?: string;
  forcePasswordChange: boolean;
  _count: { sessions: number };
};
export default async function Page() {
  const [user, security] = await Promise.all([
    getCurrentUser(),
    serverApi<Security>('/profile/me/security'),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My Profile"
        title="Account security"
        description="Review safe account activity and change your password using the existing secure flow."
      />
      <Card>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-slate-500">Username</dt>
            <dd className="font-semibold">{security.username}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Active session records</dt>
            <dd className="font-semibold">{security._count.sessions}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Last login</dt>
            <dd>
              {security.lastLoginAt
                ? new Date(security.lastLoginAt).toLocaleString()
                : 'Not recorded'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Password changed</dt>
            <dd>
              {security.passwordChangedAt
                ? new Date(security.passwordChangedAt).toLocaleString()
                : 'Not recorded'}
            </dd>
          </div>
        </dl>
      </Card>
      <Card>
        <h2 className="mb-4 font-bold">Change password</h2>
        <ChangePasswordForm csrfToken={user?.csrfToken ?? ''} />
      </Card>
      <Link className="font-semibold text-blue-700" href="/resident/profile">
        ← Back to profile
      </Link>
    </div>
  );
}

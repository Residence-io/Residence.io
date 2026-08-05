import { redirect } from 'next/navigation';
import { ChangePasswordForm } from '@/components/auth/account-form';
import { Card } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/api.server';

export const metadata = { title: 'Change password' };
export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Change your password</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">
          Temporary passwords must be replaced before you continue.
        </p>
        <ChangePasswordForm csrfToken={user.csrfToken} />
      </Card>
    </main>
  );
}

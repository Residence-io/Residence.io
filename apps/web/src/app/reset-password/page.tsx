import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/account-form';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Choose a new password' };
export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">
          Reset links are single-use and expire automatically.
        </p>
        <Suspense fallback={<p>Loading secure form…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </main>
  );
}

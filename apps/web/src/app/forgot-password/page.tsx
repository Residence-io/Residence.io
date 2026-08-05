import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/account-form';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Forgot password' };
export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">
          Enter your username or email. The response is identical whether or not
          an account exists.
        </p>
        <ForgotPasswordForm />
        <Link
          className="mt-5 block text-center text-sm font-semibold text-blue-700"
          href="/login"
        >
          Return to sign in
        </Link>
      </Card>
    </main>
  );
}

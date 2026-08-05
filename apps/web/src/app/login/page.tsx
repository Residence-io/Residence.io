import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { Card } from '@/components/ui/card';
import { roleDestination } from '@/lib/api-client';
import { getCurrentUser } from '@/lib/api.server';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleDestination(user));
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_40%),linear-gradient(#f8fafc,#eef2ff)] p-4">
      <Card className="w-full max-w-md p-7 sm:p-9">
        <div className="mb-7">
          <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-blue-700 text-white">
            <Building2 aria-hidden />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Welcome back
          </h1>
          <p className="mt-2 text-slate-600">
            Sign in to your secure Residence.io account.
          </p>
        </div>
        <LoginForm />
        <Link
          className="mt-5 block text-center text-sm font-semibold text-blue-700 hover:underline"
          href="/forgot-password"
        >
          Forgot your password?
        </Link>
      </Card>
    </main>
  );
}

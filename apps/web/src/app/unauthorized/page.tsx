import Link from 'next/link';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Access denied' };
export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="max-w-lg text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-red-700">
          Access denied
        </p>
        <h1 className="mt-2 text-3xl font-bold">You cannot open this area</h1>
        <p className="mt-3 text-slate-600">
          Your account is signed in, but it does not have the required role or
          permission.
        </p>
        <Link
          className="mt-6 inline-block font-semibold text-blue-700"
          href="/"
        >
          Return to your dashboard
        </Link>
      </Card>
    </main>
  );
}

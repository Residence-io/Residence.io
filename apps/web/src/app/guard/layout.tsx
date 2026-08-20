import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, LogOut, Home, Users, Package, Car } from 'lucide-react';
import { LogoutButton } from '@/components/shell/logout-button';

export const metadata: Metadata = {
  title: 'Gate Security | Residence.io',
};

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api.server';

export default async function GuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.forcePasswordChange) redirect('/change-password');
  if (!user.roles.includes('SECURITY_GUARD')) redirect('/unauthorized');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2 text-blue-800">
          <ShieldCheck className="size-6" />
          <span className="font-bold tracking-tight">Gate Security</span>
        </div>
        <LogoutButton />
      </header>

      <main className="flex-1 px-4 py-6">{children}</main>

      <nav className="sticky bottom-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <Link
          href="/guard"
          className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-blue-700"
        >
          <Home className="size-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Gate
          </span>
        </Link>
        <Link
          href="/guard/inside"
          className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-blue-700"
        >
          <Users className="size-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Inside
          </span>
        </Link>
        <Link
          href="/guard/deliveries"
          className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-blue-700"
        >
          <Package className="size-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Parcels
          </span>
        </Link>
        <Link
          href="/guard/vehicles"
          className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-blue-700"
        >
          <Car className="size-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Vehicles
          </span>
        </Link>
      </nav>
    </div>
  );
}

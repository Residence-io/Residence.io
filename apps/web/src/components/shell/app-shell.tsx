import Link from 'next/link';
import { Building2, LayoutDashboard, LockKeyhole } from 'lucide-react';
import type { AuthenticatedUser } from '@residence/shared';
import { LogoutButton } from './logout-button';

interface NavigationItem {
  label: string;
  href?: string;
  available?: boolean;
}

export function AppShell({
  user,
  portal,
  navigation,
  children,
}: {
  user: AuthenticatedUser;
  portal: 'Administration' | 'Resident';
  navigation: NavigationItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-slate-200 bg-slate-950 text-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600">
            <Building2 aria-hidden size={21} />
          </span>
          <div>
            <p className="font-bold">Residence.io</p>
            <p className="text-xs text-slate-400">{portal} portal</p>
          </div>
        </div>
        <nav
          aria-label={`${portal} navigation`}
          className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1"
        >
          {navigation.map((item) =>
            item.available && item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                <LayoutDashboard aria-hidden size={17} />
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                aria-disabled="true"
                className="flex min-w-max cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500"
              >
                <LockKeyhole aria-hidden size={16} />
                {item.label}
                <span className="sr-only"> unavailable</span>
              </span>
            ),
          )}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {user.displayName}
            </p>
            <p className="text-xs text-slate-500">@{user.username}</p>
          </div>
          <LogoutButton csrfToken={user.csrfToken} />
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}

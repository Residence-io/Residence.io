'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Settings,
  Shield,
  Users,
  Wallet,
} from 'lucide-react';
import type { AuthenticatedUser } from '@residence/shared';
import { LogoutButton } from './logout-button';

const ICON_MAP: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Residents: Users,
  Properties: Building2,
  Finance: Wallet,
  Helpdesk: ClipboardList,
  Workforce: HardHat,
  'Security & Visitors': Shield,
  Facilities: Building2,
  Communications: Bell,
  Reports: BarChart3,
  Administration: Settings,
  // Resident icons
  Home: LayoutDashboard,
  Payments: Wallet,
  Services: ClipboardList,
  Notifications: Bell,
  Visitors: Shield,
  'My Profile': Users,
};

export interface NavigationItem {
  label: string;
  href?: string;
  available?: boolean;
  /** Items inside this group (for grouped nav) */
  children?: NavigationItem[];
  /** Visually separate this item (bottom-aligned in sidebar) */
  bottom?: boolean;
}

function NavLink({
  item,
  depth = 0,
}: {
  item: NavigationItem;
  depth?: number;
}) {
  const pathname = usePathname();
  const Icon = ICON_MAP[item.label];
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + '/')
    : false;

  if (!item.available || !item.href) {
    return (
      <span
        aria-disabled="true"
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm cursor-not-allowed ${
          depth === 0
            ? 'text-slate-500'
            : 'ml-4 text-slate-600 text-xs py-1.5'
        }`}
      >
        {depth === 0 && Icon ? (
          <Icon aria-hidden size={16} className="shrink-0" />
        ) : depth === 0 ? (
          <LockKeyhole aria-hidden size={16} className="shrink-0" />
        ) : (
          <span className="size-1 rounded-full bg-slate-600 shrink-0" />
        )}
        {item.label}
        <LockKeyhole aria-hidden size={12} className="ml-auto shrink-0" />
        <span className="sr-only">unavailable</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        depth === 0
          ? isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-200 hover:bg-slate-800'
          : isActive
            ? 'ml-4 text-blue-400 text-xs py-1.5'
            : 'ml-4 text-slate-400 hover:text-slate-200 text-xs py-1.5'
      }`}
    >
      {depth === 0 && Icon ? (
        <Icon aria-hidden size={16} className="shrink-0" />
      ) : depth === 0 ? (
        <ChevronRight aria-hidden size={16} className="shrink-0" />
      ) : (
        <span
          className={`size-1 rounded-full shrink-0 ${isActive ? 'bg-blue-400' : 'bg-slate-500'}`}
        />
      )}
      {item.label}
    </Link>
  );
}

function NavGroup({ group }: { group: NavigationItem }) {
  const Icon = ICON_MAP[group.label];
  return (
    <div className="space-y-0.5">
      {/* Group header — not a link, just a label */}
      <p className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 first:mt-0">
        {group.label}
      </p>
      {group.children?.map((child) => (
        <NavLink key={child.label} item={child} depth={0} />
      ))}
    </div>
  );
}

function Sidebar({
  user,
  portal,
  navigation,
}: {
  user: AuthenticatedUser;
  portal: string;
  navigation: NavigationItem[];
}) {
  const mainItems = navigation.filter((i) => !i.bottom && !i.children?.length && i.label !== '__group__');
  const groupItems = navigation.filter((i) => Array.isArray(i.children));
  const flatItems = navigation.filter((i) => !i.children && !i.bottom);
  const bottomItems = navigation.filter((i) => i.bottom);

  return (
    <aside className="flex flex-col border-b border-slate-200 bg-slate-950 text-white lg:min-h-screen lg:border-b-0 lg:border-r">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 shrink-0">
        <span className="grid size-9 place-items-center rounded-xl bg-blue-600 shrink-0">
          <Building2 aria-hidden size={19} />
        </span>
        <div className="min-w-0">
          <p className="font-bold leading-tight">Residence.io</p>
          <p className="text-xs text-slate-400 truncate">{portal}</p>
        </div>
      </div>

      {/* Navigation — horizontal scroll on mobile, vertical on desktop */}
      <nav
        aria-label={`${portal} navigation`}
        className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:flex-col lg:overflow-x-visible lg:space-y-0.5 lg:px-3 lg:pb-3 lg:flex-1"
      >
        {groupItems.length > 0
          ? groupItems.map((group) => (
              <NavGroup key={group.label} group={group} />
            ))
          : flatItems.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
      </nav>

      {/* Bottom items (e.g. settings) */}
      {bottomItems.length > 0 && (
        <div className="hidden lg:block px-3 pb-4 border-t border-slate-800 pt-3 space-y-0.5 shrink-0">
          {bottomItems.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </div>
      )}
    </aside>
  );
}

function TopBar({ user }: { user: AuthenticatedUser }) {
  return (
    <header className="flex min-h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shrink-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {user.displayName}
        </p>
        <p className="text-xs text-slate-500">@{user.username}</p>
      </div>
      <LogoutButton csrfToken={user.csrfToken} />
    </header>
  );
}

export function AppShell({
  user,
  portal,
  navigation,
  children,
}: {
  user: AuthenticatedUser;
  portal: string;
  navigation: NavigationItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
      <Sidebar user={user} portal={portal} navigation={navigation} />
      <div className="flex min-w-0 flex-col">
        <TopBar user={user} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

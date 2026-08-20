'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LockKeyhole,
  Menu,
  X
} from 'lucide-react';
import type { AuthenticatedUser } from '@residence/shared';
import { LogoutButton } from './logout-button';

const ICON_MAP: Record<string, React.ElementType> = {};

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
  onClick,
}: {
  item: NavigationItem;
  depth?: number;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + '/')
    : false;

  if (!item.available || !item.href) {
    return (
      <span
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 ${
          depth > 0 ? 'ml-4' : ''
        }`}
      >
        <LockKeyhole aria-hidden size={12} className="ml-auto shrink-0" />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        depth === 0
          ? isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
          : isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-900 ml-4'
      }`}
    >
      {item.label}
    </Link>
  );
}

function NavGroup({ group, onNavigate }: { group: NavigationItem; onNavigate?: () => void }) {
  return (
    <div className="space-y-0.5">
      <p className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 first:mt-0">
        {group.label}
      </p>
      {group.children?.map((child) => (
        <NavLink key={child.label} item={child} depth={0} onClick={onNavigate} />
      ))}
    </div>
  );
}

function Sidebar({
  portal,
  navigation,
  onNavigate,
}: {
  portal: string;
  navigation: NavigationItem[];
  onNavigate?: () => void;
}) {
  const groupItems = navigation.filter((i) => Array.isArray(i.children));
  const flatItems = navigation.filter((i) => !i.children && !i.bottom);
  const bottomItems = navigation.filter((i) => i.bottom);

  return (
    <aside className="flex flex-col h-full bg-slate-950 text-white">
      <div className="flex items-center justify-between px-5 py-5 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-blue-600 shrink-0">
            <Building2 aria-hidden size={19} />
          </span>
          <div className="min-w-0">
            <p className="font-bold leading-tight">Residence.io</p>
            <p className="text-xs text-slate-400 truncate">{portal}</p>
          </div>
        </div>
        <button onClick={onNavigate} className="lg:hidden p-1 text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav aria-label={`${portal} navigation`} className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {groupItems.length > 0
          ? groupItems.map((group) => (
              <NavGroup key={group.label} group={group} onNavigate={onNavigate} />
            ))
          : flatItems.map((item) => (
              <NavLink key={item.label} item={item} onClick={onNavigate} />
            ))}
      </nav>

      {bottomItems.length > 0 && (
        <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-0.5 shrink-0">
          {bottomItems.map((item) => (
            <NavLink key={item.label} item={item} onClick={onNavigate} />
          ))}
        </div>
      )}
    </aside>
  );
}

function TopBar({ user, onMenuClick }: { user: AuthenticatedUser; onMenuClick: () => void }) {
  return (
    <header className="flex min-h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName}</p>
          <p className="text-xs text-slate-500">@{user.username}</p>
        </div>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 border-r border-slate-800">
        <Sidebar portal={portal} navigation={navigation} />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex w-full max-w-[280px] flex-col bg-slate-950 shadow-2xl">
            <Sidebar portal={portal} navigation={navigation} onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col min-h-screen">
        <TopBar user={user} onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

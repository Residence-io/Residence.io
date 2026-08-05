'use client';

import { LogOut } from 'lucide-react';
import { signOutAction } from '@/app/actions/auth';

export function LogoutButton({ csrfToken }: { csrfToken?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      >
        <LogOut aria-hidden size={16} />
        Logout
      </button>
    </form>
  );
}

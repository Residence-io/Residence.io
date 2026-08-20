import { Metadata } from 'next';
import Link from 'next/link';
import { ScanLine, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Gate Security | Residence.io',
};

export default function GuardDashboardPage() {
  return (
    <div className="space-y-6 max-w-sm mx-auto pt-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Gate Actions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Process visitor entries and exits
        </p>
      </div>

      <div className="grid gap-4 mt-8">
        <Link href="/guard/scan">
          <Card className="flex items-center p-6 gap-6 hover:border-blue-300 hover:shadow-md transition-all active:bg-slate-50 cursor-pointer border-2 border-slate-200">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <ScanLine className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Scan QR Code</h2>
              <p className="text-sm text-slate-500">
                Scan visitor pass at gate
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/guard/walk-in">
          <Card className="flex items-center p-6 gap-6 hover:border-blue-300 hover:shadow-md transition-all active:bg-slate-50 cursor-pointer border-2 border-slate-200">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <UserPlus className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Walk-in Visitor
              </h2>
              <p className="text-sm text-slate-500">
                Manual entry for uninvited guests
              </p>
            </div>
          </Card>
        </Link>
      </div>

      <div className="mt-8 text-center text-sm">
        <form
          action="/guard/scan"
          method="GET"
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"
        >
          <label className="block text-slate-700 font-semibold mb-2">
            Manual Pass Code
          </label>
          <div className="flex gap-2">
            <input
              name="code"
              type="text"
              placeholder="e.g. A3KF9X2"
              className="flex-1 uppercase rounded-xl border border-slate-300 px-3 py-2 text-center font-mono font-bold tracking-widest text-slate-900"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
            >
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/states';

export const metadata: Metadata = {
  title: 'My Visitors | Residence.io',
};

export default async function VisitorsPage() {
  // We'll fetch passes here
  let passes = [];
  try {
    passes = (await serverApi('/visitors/me')) as any[];
  } catch (error) {
    console.error('Failed to fetch visitors', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="My Visitors"
          description="Manage your guest invitations and gate passes."
        />
        <Link
          href="/resident/visitors/new"
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <Plus className="size-4" />
          Invite Visitor
        </Link>
      </div>

      {passes.length === 0 ? (
        <EmptyState title="No visitors expected">
          Invite a guest and generate a gate pass for their easy entry.
          <div className="mt-4">
            <Link
              href="/resident/visitors/new"
              className="text-blue-700 font-bold hover:underline"
            >
              Invite Visitor
            </Link>
          </div>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {passes.map((pass: any) => (
            <Link key={pass.id} href={`/resident/visitors/${pass.id}`}>
              <Card className="group flex h-full cursor-pointer flex-col p-5 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {pass.visitorName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(pass.visitDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      pass.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : pass.status === 'CHECKED_IN'
                          ? 'bg-blue-100 text-blue-800'
                          : pass.status === 'CANCELLED'
                            ? 'bg-slate-100 text-slate-800'
                            : pass.status === 'EXPIRED' ||
                                pass.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {pass.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex-1">
                  <p className="text-sm text-slate-600 line-clamp-2">
                    <span className="font-semibold text-slate-700">
                      Purpose:
                    </span>{' '}
                    {pass.purpose}
                  </p>
                  {pass.passCode && (
                    <p className="text-sm font-mono font-bold mt-2 text-slate-900 bg-slate-50 inline-block px-2 py-1 rounded">
                      {pass.passCode}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

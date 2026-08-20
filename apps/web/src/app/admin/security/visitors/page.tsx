'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';

export default function AdminVisitorsPage() {
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPasses() {
    try {
      const res = await fetch('/api/proxy/admin/visitors');
      if (res.ok) {
        setPasses(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line
    loadPasses();
  }, []);

  async function updateStatus(id: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch(`/api/proxy/admin/visitors/${id}/${action}`, {
        method: 'PATCH',
      });
      if (res.ok) {
        loadPasses();
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitor Passes"
        description="Manage society visitor passes and view history"
      />

      {passes.length === 0 ? (
        <EmptyState title="No visitor passes found">
          No visitor passes have been requested.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 font-semibold text-slate-900 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Host / Unit</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {passes.map((pass) => (
                <tr
                  key={pass.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">
                      {pass.visitorName}
                    </p>
                    <p className="text-xs text-slate-500">{pass.purpose}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p>{pass.resident?.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {pass.unit?.unitNumber || 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(pass.visitDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        pass.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : pass.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : pass.status === 'WAITING_APPROVAL'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {pass.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {pass.status === 'WAITING_APPROVAL' && (
                      <>
                        <Button
                          className="px-2 py-1 text-sm bg-green-600 text-white hover:bg-green-700"
                          onClick={() => updateStatus(pass.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          className="px-2 py-1 text-sm bg-red-600 hover:bg-red-700"
                          onClick={() => updateStatus(pass.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

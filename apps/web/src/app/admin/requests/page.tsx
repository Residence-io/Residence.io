'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

interface AdminReq {
  id: string;
  requestNumber: string;
  requestType: string;
  title: string;
  description?: string;
  status: string;
  submittedAt: string;
  resident: { fullName: string; residentNumber: string };
  property?: { block: string; propertyNumber: string };
  unit?: { unitNumber: string };
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminReq[]>([]);
  const [selectedReq, setSelectedReq] = useState<AdminReq | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(() => {
    fetch('/api/proxy/admin/resident-requests')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoading(true);
      const res = await fetch(
        `/api/proxy/admin/resident-requests/${id}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, rejectionReason }),
        },
      );
      if (res.ok) {
        setSelectedReq(null);
        setRejectionReason('');
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssue = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(
        `/api/proxy/admin/resident-requests/${id}/issue`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Resident Requests & NOCs"
        description="Review resident applications, approve permissions, and issue certificates."
      />

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
            <tr>
              <th className="p-4">Request #</th>
              <th className="p-4">Resident</th>
              <th className="p-4">Type</th>
              <th className="p-4">Title</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold text-xs text-slate-700">
                  {r.requestNumber}
                </td>
                <td className="p-4 font-medium text-slate-900">
                  {r.resident.fullName}
                </td>
                <td className="p-4 text-xs text-slate-600">
                  {r.requestType.replace(/_/g, ' ')}
                </td>
                <td className="p-4 text-slate-800">{r.title}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {r.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' ? (
                    <>
                      <button
                        onClick={() => handleReview(r.id, 'APPROVED')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setSelectedReq(r)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </>
                  ) : r.status === 'APPROVED' ? (
                    <button
                      onClick={() => handleIssue(r.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Issue Certificate
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No resident requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reject Request</h3>
            <p className="text-xs text-slate-500">
              Provide a reason for rejecting request {selectedReq.requestNumber}
              .
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Outstanding maintenance dues must be cleared first..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedReq(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(selectedReq.id, 'REJECTED')}
                disabled={actionLoading || !rejectionReason}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

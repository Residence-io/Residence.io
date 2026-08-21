'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { CheckCircle, Clock, XCircle, LogOut } from 'lucide-react';

interface MoveOutReq {
  id: string;
  requestNumber: string;
  desiredMoveOutDate: string;
  status: string;
  duesClearanceStatus: string;
  parkingClearanceStatus: string;
  submittedAt: string;
  property?: { block: string; propertyNumber: string };
  unit?: { unitNumber: string };
}

export default function ResidentMoveOutPage() {
  const [requests, setRequests] = useState<MoveOutReq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/move-out-requests/me')
      .then((res) => res.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Departure"
        title="Move-Out & Clearance"
        description="Track your dues clearance, parking permit closure, and Move-Out NOC issuance."
      />

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          Loading move-out requests...
        </div>
      ) : requests.length === 0 ? (
        <Card className="py-12 text-center">
          <LogOut className="mx-auto size-12 text-slate-300 mb-2" />
          <h4 className="font-semibold text-slate-800">
            No active move-out requests
          </h4>
          <p className="text-xs text-slate-500">
            When planning to relocate, apply for Move-Out Clearance here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {requests.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-500">
                  {r.requestNumber}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                  {r.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900">
                Unit {r.unit?.unitNumber || 'Assigned Unit'}, Block{' '}
                {r.property?.block || '-'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Move-Out Date:{' '}
                {new Date(r.desiredMoveOutDate).toLocaleDateString()}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400">Dues Clearance:</span>
                  <span className="font-semibold block text-slate-700">
                    {r.duesClearanceStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Parking Clearance:</span>
                  <span className="font-semibold block text-slate-700">
                    {r.parkingClearanceStatus}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Key } from 'lucide-react';

interface MoveInReq {
  id: string;
  requestNumber: string;
  occupancyType: string;
  desiredMoveInDate: string;
  status: string;
  submittedAt: string;
  property?: { block: string; propertyNumber: string };
  unit?: { unitNumber: string };
}

export default function ResidentMoveInPage() {
  const [requests, setRequests] = useState<MoveInReq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/move-in-requests/me')
      .then((res) => res.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Move-In Requests"
        description="Track your move-in clearance, occupancy activation, and gate pass onboarding."
      />

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          Loading move-in requests...
        </div>
      ) : requests.length === 0 ? (
        <Card className="py-12 text-center">
          <Key className="mx-auto size-12 text-slate-300 mb-2" />
          <h4 className="font-semibold text-slate-800">
            No active move-in applications
          </h4>
          <p className="text-xs text-slate-500">
            Contact society administration or submit an onboarding application.
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
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {r.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900">
                Unit {r.unit?.unitNumber || 'Assigned Unit'}, Block{' '}
                {r.property?.block || '-'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Type: {r.occupancyType} • Desired Date:{' '}
                {new Date(r.desiredMoveInDate).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function AdminMoveInOutPage() {
  const [activeTab, setActiveTab] = useState<'IN' | 'OUT'>('IN');
  const [moveIns, setMoveIns] = useState<any[]>([]);
  const [moveOuts, setMoveOuts] = useState<any[]>([]);

  const reloadData = useCallback(() => {
    Promise.all([
      fetch('/api/proxy/admin/move-in-requests').then((r) =>
        r.ok ? r.json() : [],
      ),
      fetch('/api/proxy/admin/move-out-requests').then((r) =>
        r.ok ? r.json() : [],
      ),
    ])
      .then(([inData, outData]) => {
        setMoveIns(Array.isArray(inData) ? inData : []);
        setMoveOuts(Array.isArray(outData) ? outData : []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const handleApproveMoveIn = async (id: string) => {
    await fetch(`/api/proxy/admin/move-in-requests/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    reloadData();
  };

  const handleCompleteMoveIn = async (id: string) => {
    await fetch(`/api/proxy/admin/move-in-requests/${id}/complete`, {
      method: 'PATCH',
    });
    reloadData();
  };

  const handleClearanceMoveOut = async (id: string) => {
    await fetch(`/api/proxy/admin/move-out-requests/${id}/clearance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duesClearanceStatus: 'CLEARED',
        parkingClearanceStatus: 'CLEARED',
      }),
    });
    await fetch(`/api/proxy/admin/move-out-requests/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    reloadData();
  };

  const handleCompleteMoveOut = async (id: string) => {
    await fetch(`/api/proxy/admin/move-out-requests/${id}/complete`, {
      method: 'PATCH',
    });
    reloadData();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Move-In & Move-Out Management"
        description="Process resident onboarding occupancies and relocation clearance workflows."
      />

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('IN')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg ${
            activeTab === 'IN'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Move-In Applications ({moveIns.length})
        </button>
        <button
          onClick={() => setActiveTab('OUT')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg ${
            activeTab === 'OUT'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Move-Out Requests ({moveOuts.length})
        </button>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
            <tr>
              <th className="p-4">Request #</th>
              <th className="p-4">Resident</th>
              <th className="p-4">Property / Unit</th>
              <th className="p-4">Target Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTab === 'IN'
              ? moveIns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-xs">
                      {r.requestNumber}
                    </td>
                    <td className="p-4 font-medium">{r.resident?.fullName}</td>
                    <td className="p-4">
                      Unit {r.unit?.unitNumber}, Block {r.property?.block}
                    </td>
                    <td className="p-4">
                      {new Date(r.desiredMoveInDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {r.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleApproveMoveIn(r.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Approve
                        </button>
                      )}
                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => handleCompleteMoveIn(r.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Complete Onboarding
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              : moveOuts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-xs">
                      {r.requestNumber}
                    </td>
                    <td className="p-4 font-medium">{r.resident?.fullName}</td>
                    <td className="p-4">
                      Unit {r.unit?.unitNumber}, Block {r.property?.block}
                    </td>
                    <td className="p-4">
                      {new Date(r.desiredMoveOutDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {r.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleClearanceMoveOut(r.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Clear Dues & Approve
                        </button>
                      )}
                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => handleCompleteMoveOut(r.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Complete Move-Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

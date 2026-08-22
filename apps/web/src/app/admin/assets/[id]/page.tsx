'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function AdminAssetDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadAsset = () => {
    if (!id) return;
    fetch(`/api/proxy/admin/assets/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setAsset(data);
        if (data) setNewStatus(data.status);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAsset();
  }, [id]);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || newStatus === asset.status) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/proxy/admin/assets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: statusReason }),
      });
      if (res.ok) {
        setStatusReason('');
        loadAsset();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500">
        Loading asset details...
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/assets"
          className="inline-flex items-center gap-1 text-sm text-blue-600"
        >
          <ArrowLeft className="size-4" /> Back to Assets
        </Link>
        <Card className="text-center py-12">
          <h3 className="text-lg font-semibold text-slate-800">
            Asset Not Found
          </h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/assets"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" /> Back to Assets
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {asset.assetCode}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {asset.name}
          </h1>
          <p className="text-sm text-slate-500">
            {asset.category.replace('_', ' ')} •{' '}
            {asset.location || 'Location unassigned'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Specifications & Info
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Condition</span>
                <span className="font-medium text-slate-800">
                  {asset.condition}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">
                  Manufacturer
                </span>
                <span className="font-medium text-slate-800">
                  {asset.manufacturer || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Model</span>
                <span className="font-medium text-slate-800">
                  {asset.model || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">
                  Serial Number
                </span>
                <span className="font-medium text-slate-800">
                  {asset.serialNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">
                  Purchase Cost
                </span>
                <span className="font-medium text-slate-800">
                  {asset.purchaseCost
                    ? `${asset.currency} ${Number(asset.purchaseCost).toLocaleString()}`
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Facility</span>
                <span className="font-medium text-slate-800">
                  {asset.facility?.name || '—'}
                </span>
              </div>
            </div>
            {asset.notes && (
              <div className="pt-2 border-t text-sm">
                <span className="text-xs text-slate-500 block mb-1">Notes</span>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {asset.notes}
                </p>
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Maintenance History
            </h2>
            {asset.maintenanceRequests?.length === 0 ? (
              <p className="text-sm text-slate-500">
                No maintenance tickets linked to this asset.
              </p>
            ) : (
              <div className="divide-y text-sm">
                {asset.maintenanceRequests?.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-mono font-medium text-blue-600">
                        {ticket.ticketNumber}
                      </span>
                      <p className="font-medium text-slate-800">
                        {ticket.subject}
                      </p>
                    </div>
                    <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded">
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Status & Lifecycle
            </h2>
            <form onSubmit={handleStatusChange} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="IN_MAINTENANCE">In Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                  <option value="RETIRED">Retired</option>
                  <option value="DISPOSED">Disposed</option>
                </select>
              </div>
              {newStatus !== asset.status && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Reason for Status Change
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Provide reason for audit log..."
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              )}
              {newStatus !== asset.status && (
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              )}
            </form>

            <div className="pt-3 border-t space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status History
              </h4>
              <div className="space-y-2 text-xs">
                {asset.statusHistory?.map((h: any) => (
                  <div key={h.id} className="p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between font-medium text-slate-700">
                      <span>
                        {h.fromStatus || 'INIT'} &rarr; {h.toStatus}
                      </span>
                      <span className="text-slate-400">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {h.reason && (
                      <p className="text-slate-600 mt-1">{h.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function AdminInventoryDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementData, setMovementData] = useState({
    type: 'RECEIPT',
    quantity: '',
    unitCost: '',
    reference: '',
    notes: '',
  });

  const loadItem = () => {
    if (!id) return;
    fetch(`/api/proxy/admin/inventory/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadItem();
  }, [id]);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/proxy/admin/inventory/${id}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: movementData.type,
          quantity: Number(movementData.quantity),
          unitCost: movementData.unitCost
            ? Number(movementData.unitCost)
            : undefined,
          reference: movementData.reference || undefined,
          notes: movementData.notes || undefined,
        }),
      });
      if (res.ok) {
        setShowMovementModal(false);
        setMovementData({
          type: 'RECEIPT',
          quantity: '',
          unitCost: '',
          reference: '',
          notes: '',
        });
        loadItem();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="text-center py-12 text-slate-500">Loading item...</div>
    );
  if (!item)
    return (
      <div className="text-center py-12 text-slate-500">Item not found</div>
    );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/inventory"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" /> Back to Inventory
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {item.sku}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {item.name}
          </h1>
          <p className="text-sm text-slate-500">
            {item.category} • Unit: {item.unitOfMeasure}
          </p>
        </div>
        <button
          onClick={() => setShowMovementModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          Record Stock Movement
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Current Stock
          </span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {item.currentQuantity}{' '}
            <span className="text-base font-normal text-slate-500">
              {item.unitOfMeasure}
            </span>
          </p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Reorder Level
          </span>
          <p className="text-3xl font-extrabold text-slate-700 mt-1">
            {item.reorderLevel}{' '}
            <span className="text-base font-normal text-slate-500">
              {item.unitOfMeasure}
            </span>
          </p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Unit Cost
          </span>
          <p className="text-3xl font-extrabold text-slate-700 mt-1">
            {item.currency} {Number(item.unitCost).toLocaleString()}
          </p>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Stock Movement Ledger
          </h2>
          <span className="text-xs text-slate-500">Immutable Audit Trail</span>
        </div>

        {item.movements?.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No movements recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Quantity</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {item.movements?.map((m: any) => {
                  const isAdd = [
                    'OPENING_BALANCE',
                    'RECEIPT',
                    'ADJUSTMENT_IN',
                    'RETURN',
                  ].includes(m.type);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 text-slate-600 text-xs">
                        {new Date(m.occurredAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            isAdd
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold">
                        {isAdd ? '+' : '-'}
                        {m.quantity} {item.unitOfMeasure}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">
                        {m.reference || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">
                        {m.createdByUser?.fullName || 'System'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Record Stock Movement
            </h3>
            <form onSubmit={handleRecordMovement} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Movement Type *
                </label>
                <select
                  value={movementData.type}
                  onChange={(e) =>
                    setMovementData({ ...movementData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="RECEIPT">Stock Receipt (Inflow)</option>
                  <option value="ISSUE">Stock Issue (Outflow)</option>
                  <option value="ADJUSTMENT_IN">
                    Adjustment In (Correction +)
                  </option>
                  <option value="ADJUSTMENT_OUT">
                    Adjustment Out (Correction -)
                  </option>
                  <option value="RETURN">Return to Store (Inflow)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity ({item.unitOfMeasure}) *
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  min="0.001"
                  value={movementData.quantity}
                  onChange={(e) =>
                    setMovementData({
                      ...movementData,
                      quantity: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reference / PO / Work Order
                </label>
                <input
                  type="text"
                  value={movementData.reference}
                  onChange={(e) =>
                    setMovementData({
                      ...movementData,
                      reference: e.target.value,
                    })
                  }
                  placeholder="e.g. PO-2026-001"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={movementData.notes}
                  onChange={(e) =>
                    setMovementData({ ...movementData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

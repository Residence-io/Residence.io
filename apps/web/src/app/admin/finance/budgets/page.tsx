'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [activeBudget, setActiveBudget] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [plannedAmounts] = useState<Record<string, number>>({
    MAINTENANCE: 500000,
    SECURITY: 300000,
    UTILITIES: 200000,
    CLEANING: 150000,
  });

  const loadBudgets = useCallback(() => {
    fetch('/api/proxy/finance/budgets')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any) => {
        const list = Array.isArray(data) ? data : [];
        setBudgets(list);
        if (list.length > 0) {
          return fetch(`/api/proxy/finance/budgets/${list[0].id}`).then((r) =>
            r.ok ? r.json() : null,
          );
        }
        return null;
      })
      .then((full: any) => {
        if (full) setActiveBudget(full);
      })
      .catch(() => {
        setBudgets([]);
      });
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lines = Object.entries(plannedAmounts).map(
        ([category, plannedAmount]) => ({
          category,
          plannedAmount,
        }),
      );
      await fetch('/api/proxy/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          financialYear,
          lines,
        }),
      });
      setShowModal(false);
      loadBudgets();
    } catch (err: any) {
      alert(err.message || 'Failed to create budget');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          eyebrow="Finance"
          title="Budget Management"
          description="Plan annual budgets, track category allocations, and monitor real-time spend variance."
        />
        <Button onClick={() => setShowModal(true)}>+ Create Budget</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-3">
          <h3 className="font-bold text-sm text-slate-600">Financial Years</h3>
          {budgets.map((b) => (
            <div
              key={b.id}
              onClick={async () => {
                const res = await fetch(`/api/proxy/finance/budgets/${b.id}`);
                if (res.ok) {
                  const full = await res.json();
                  setActiveBudget(full);
                }
              }}
              className={`p-3 rounded border cursor-pointer ${
                activeBudget?.id === b.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200'
              }`}
            >
              <p className="font-semibold">{b.name}</p>
              <p className="text-xs text-slate-500">
                FY {b.financialYear} • {b.status}
              </p>
            </div>
          ))}
        </Card>

        <Card className="md:col-span-2 space-y-4">
          {activeBudget ? (
            <>
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-lg font-bold">{activeBudget.name}</h3>
                  <p className="text-xs text-slate-500">
                    Financial Year: {activeBudget.financialYear} • Status:{' '}
                    {activeBudget.status}
                  </p>
                </div>
                {activeBudget.status === 'DRAFT' && (
                  <button
                    type="button"
                    className="rounded-lg bg-blue-700 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-800"
                    onClick={async () => {
                      await fetch(
                        `/api/proxy/finance/budgets/${activeBudget.id}/approve`,
                        {
                          method: 'POST',
                        },
                      );
                      loadBudgets();
                    }}
                  >
                    Approve Budget
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Category</th>
                      <th className="p-3">Planned (PKR)</th>
                      <th className="p-3">Actual (PKR)</th>
                      <th className="p-3">Variance (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBudget.lines?.map((line: any) => (
                      <tr key={line.id} className="border-b">
                        <td className="p-3 font-medium">{line.category}</td>
                        <td className="p-3 font-mono">{line.plannedAmount}</td>
                        <td className="p-3 font-mono text-blue-700 font-semibold">
                          {line.actualAmount || '0.00'}
                        </td>
                        <td
                          className={`p-3 font-mono font-semibold ${
                            Number(line.variance) < 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {line.variance || line.plannedAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Select or create a budget to view details.
            </p>
          )}
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 bg-white space-y-4">
            <h3 className="text-lg font-bold">New Annual Budget</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Budget Name *</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">
                  Financial Year *
                </label>
                <Input
                  required
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

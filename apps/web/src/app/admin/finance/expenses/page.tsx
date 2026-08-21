'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MAINTENANCE');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [vendorId, setVendorId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/proxy/finance/expenses').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/proxy/finance/vendors').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([expRes, venRes]: [any, any]) => {
        setExpenses(Array.isArray(expRes) ? expRes : []);
        setVendors(Array.isArray(venRes) ? venRes : []);
        setLoading(false);
      })
      .catch(() => {
        setExpenses([]);
        setVendors([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/proxy/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          category,
          amount: Number(amount),
          expenseDate,
          vendorId: vendorId || undefined,
          invoiceNumber: invoiceNumber || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit expense');
      }
      setShowModal(false);
      setDescription('');
      setAmount('');
      setInvoiceNumber('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await fetch(`/api/proxy/finance/expenses/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to review expense');
    }
  };

  const handlePay = async (id: string) => {
    try {
      await fetch(`/api/proxy/finance/expenses/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'BANK_TRANSFER' }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          eyebrow="Finance"
          title="Expense Management"
          description="Create, review, approve, and record payments for society operational expenses."
        />
        <Button onClick={() => setShowModal(true)}>+ New Expense</Button>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-slate-500">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-slate-500">No expenses recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold">
                      {e.expenseNumber}
                    </td>
                    <td className="p-3">
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-medium">{e.description}</td>
                    <td className="p-3">{e.category}</td>
                    <td className="p-3">{e.vendor?.name || '—'}</td>
                    <td className="p-3 font-bold">
                      {e.currency} {Number(e.amount).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          e.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : e.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : e.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      {e.status === 'SUBMITTED' && (
                        <>
                          <button
                            type="button"
                            className="rounded-lg bg-blue-700 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-800"
                            onClick={() => handleReview(e.id, 'APPROVED')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => handleReview(e.id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {e.status === 'APPROVED' && (
                        <button
                          type="button"
                          className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800"
                          onClick={() => handlePay(e.id)}
                        >
                          Record Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 bg-white space-y-4">
            <h3 className="text-lg font-bold">Record Society Expense</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Description *</label>
                <Input
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Category</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="UTILITIES">Utilities</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="SECURITY">Security</option>
                  <option value="SALARIES">Salaries</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="LANDSCAPING">Landscaping</option>
                  <option value="SUPPLIES">Supplies</option>
                  <option value="FACILITY">Facility</option>
                  <option value="ADMINISTRATION">Administration</option>
                  <option value="TAX">Tax</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold">Amount (PKR) *</label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Expense Date *</label>
                <Input
                  required
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">
                  Vendor (Optional)
                </label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">No Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.vendorCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold">
                  Invoice Number (Optional)
                </label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
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
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Expense'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

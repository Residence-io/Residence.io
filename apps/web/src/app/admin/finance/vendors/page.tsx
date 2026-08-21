'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('MAINTENANCE');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadVendors = useCallback(() => {
    fetch('/api/proxy/finance/vendors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any) => {
        setVendors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setVendors([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/proxy/finance/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contactPerson: contactPerson || undefined,
          phone: phone || undefined,
          email: email || undefined,
          category,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create vendor');
      }
      setShowModal(false);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setNotes('');
      loadVendors();
    } catch (err: any) {
      alert(err.message || 'Failed to create vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          eyebrow="Finance"
          title="Vendor Management"
          description="Manage approved suppliers, service providers, contractors, and contact details."
        />
        <Button onClick={() => setShowModal(true)}>+ Add Vendor</Button>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-slate-500">Loading vendors...</p>
        ) : vendors.length === 0 ? (
          <p className="text-sm text-slate-500">No vendors registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">Vendor Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold">
                      {v.vendorCode}
                    </td>
                    <td className="p-3 font-medium">{v.name}</td>
                    <td className="p-3">{v.category}</td>
                    <td className="p-3">{v.contactPerson || '—'}</td>
                    <td className="p-3">{v.phone || '—'}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                        {v.status}
                      </span>
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
            <h3 className="text-lg font-bold">Add New Vendor</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Vendor Name *</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Category</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="SECURITY">Security</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="LANDSCAPING">Landscaping</option>
                  <option value="SUPPLIES">Supplies</option>
                  <option value="CONTRACTOR">Contractor</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold">Contact Person</label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Notes</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {submitting ? 'Saving...' : 'Save Vendor'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

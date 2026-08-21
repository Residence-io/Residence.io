'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminEmergencyContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Security Gate');
  const [phone, setPhone] = useState('');

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/proxy/admin/emergency-contacts');
      if (res.ok) setContacts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/proxy/admin/emergency-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, phone }),
    });
    if (res.ok) {
      setShowModal(false);
      setName('');
      setPhone('');
      fetchContacts();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/proxy/admin/emergency-contacts/${id}`, {
      method: 'DELETE',
    });
    fetchContacts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Community"
          title="Emergency Contacts Directory"
          description="Configure society security and local emergency service numbers for residents."
        />
        <Button
          onClick={() => setShowModal(true)}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="size-4" /> Add Emergency Contact
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Phone Number</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((c) => (
              <tr key={c.id}>
                <td className="p-4 font-semibold text-slate-900">{c.name}</td>
                <td className="p-4 text-xs">{c.category}</td>
                <td className="p-4 font-mono font-medium">{c.phone}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  No emergency contacts configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Add Emergency Contact
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Main Gate Security"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <Input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Security / Police / Ambulance"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone
                </label>
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 021-111-222-333"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <Button type="submit">Save Contact</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

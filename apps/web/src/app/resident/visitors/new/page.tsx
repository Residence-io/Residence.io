'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewVisitorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      visitorName: formData.get('visitorName'),
      visitorPhone: formData.get('visitorPhone'),
      purpose: formData.get('purpose'),
      vehicleNumber: formData.get('vehicleNumber'),
      numberOfGuests: parseInt(formData.get('numberOfGuests') as string) || 1,
      visitDate: formData.get('visitDate')
        ? new Date(formData.get('visitDate') as string).toISOString()
        : new Date().toISOString(),
      isRecurring: formData.get('isRecurring') === 'on',
    };

    try {
      const res = await fetch('/api/proxy/visitors/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to invite visitor');
      }

      router.push('/resident/visitors');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invite Visitor"
        description="Fill out the details below to generate a gate pass."
      />

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Visitor Name *
              </span>
              <Input name="visitorName" required placeholder="e.g. Ali Khan" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Phone Number *
              </span>
              <Input
                name="visitorPhone"
                required
                type="tel"
                placeholder="+92..."
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Purpose *
              </span>
              <Input
                name="purpose"
                required
                placeholder="e.g. Family Visit, Delivery"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Visit Date *
              </span>
              <Input name="visitDate" required type="date" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Vehicle Number
              </span>
              <Input name="vehicleNumber" placeholder="Optional" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Number of Guests
              </span>
              <Input
                name="numberOfGuests"
                type="number"
                min="1"
                defaultValue="1"
              />
            </label>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isRecurring"
              className="rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">
              This is a recurring visitor (e.g. Maid, Driver)
            </span>
          </label>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-700 text-white hover:bg-blue-800"
            >
              {loading ? 'Creating...' : 'Create Gate Pass'}
            </Button>
            <Link
              href="/resident/visitors"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

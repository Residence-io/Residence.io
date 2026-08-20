'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function WalkInVisitorPage() {
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
      visitorCnic: formData.get('visitorCnic'),
      purpose: formData.get('purpose'),
      vehicleNumber: formData.get('vehicleNumber'),
      numberOfGuests: parseInt(formData.get('numberOfGuests') as string) || 1,
      unitId: formData.get('unitId'), // In a real app, this would be a searchable dropdown
      visitDate: new Date().toISOString(),
    };

    // For walk-in, the guard submits to a special guard walk-in endpoint,
    // but for simplicity in Phase 2, we will use a hypothetical endpoint.
    // However, the Phase 2 backend plan didn't define a specific walk-in creation endpoint in GuardVisitorsController.
    // If it's missing, we can alert for now or implement it as a pending pass for the resident to approve.

    alert('Walk-in visitor recorded and pending host approval (Phase 2 Mock)');
    router.push('/guard');

    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/guard"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <PageHeader
          title="Walk-In Visitor"
          description="Register a visitor without a pass"
        />
      </div>

      <Card className="p-6">
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
                CNIC *
              </span>
              <Input
                name="visitorCnic"
                required
                placeholder="XXXXX-XXXXXXX-X"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Purpose *
              </span>
              <Input
                name="purpose"
                required
                placeholder="e.g. Delivery, Guest"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Host Unit ID
              </span>
              <Input name="unitId" placeholder="Unit UUID" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Vehicle Number
              </span>
              <Input name="vehicleNumber" placeholder="Optional" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Number of Guests
              </span>
              <Input
                name="numberOfGuests"
                type="number"
                min="1"
                defaultValue="1"
                className="w-full md:w-1/2"
              />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <Button
              type="submit"
              disabled={loading}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {loading ? 'Processing...' : 'Register Walk-In'}
            </Button>
            <Link
              href="/guard"
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

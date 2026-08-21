'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewResidentRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [requestType, setRequestType] = useState('RESIDENCE_CERTIFICATE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/proxy/resident-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          title,
          description,
        }),
      });

      if (res.ok) {
        router.push('/resident/requests');
      }
    } catch (err) {
      console.error('Request creation failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Requests"
        title="Submit New Request"
        description="Choose a request type to initiate an official society workflow."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Request Type
            </label>
            <select
              value={requestType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setRequestType(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="RESIDENCE_CERTIFICATE">
                Residence Certificate
              </option>
              <option value="MAINTENANCE_CLEARANCE">
                Maintenance Dues Clearance
              </option>
              <option value="MOVE_OUT_NOC">Move-Out NOC</option>
              <option value="PROPERTY_TRANSFER_CLEARANCE">
                Property Transfer Clearance
              </option>
              <option value="RENOVATION_PERMISSION">
                Renovation Permission
              </option>
              <option value="CONTRACTOR_ENTRY">
                Contractor Work Gate Pass
              </option>
              <option value="VEHICLE_STICKER">
                Vehicle Gate Sticker Request
              </option>
              <option value="EVENT_PERMISSION">
                Community Event / Gathering
              </option>
              <option value="OTHER">Other Request</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title
            </label>
            <Input
              required
              placeholder="e.g. Request for Residence Proof Certificate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Purpose
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe the context and any specific details required..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

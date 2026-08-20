'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';

export default function GuardInsidePage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  async function loadVisitors() {
    try {
      const res = await fetch('/api/proxy/guard/visitors/inside');
      if (res.ok) {
        setVisitors(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line
    loadVisitors();
  }, []);

  async function handleCheckOut(checkInId: string) {
    setCheckingOut(checkInId);
    try {
      const res = await fetch(
        `/api/proxy/guard/visitors/${checkInId}/check-out`,
        {
          method: 'PATCH',
        },
      );
      if (!res.ok) throw new Error('Check out failed');
      await loadVisitors();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCheckingOut(null);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Currently Inside"
        description="Visitors currently on premises"
      />

      {visitors.length === 0 ? (
        <EmptyState title="No visitors inside">
          There are no checked-in visitors at the moment.
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {visitors.map((record) => (
            <Card
              key={record.id}
              className="p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center"
            >
              <div>
                <h3 className="font-bold text-slate-900">
                  {record.visitorPass.visitorName}
                </h3>
                <p className="text-sm text-slate-500">
                  Host: {record.visitorPass.resident?.fullName} (Unit{' '}
                  {record.visitorPass.unit?.unitNumber || 'N/A'})
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  In: {new Date(record.checkedInAt).toLocaleTimeString()}
                </p>
              </div>
              <Button
                onClick={() => handleCheckOut(record.id)}
                disabled={checkingOut === record.id}
                className="w-full sm:w-auto bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                {checkingOut === record.id ? 'Checking Out...' : 'Check Out'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

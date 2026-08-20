'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VisitorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [pass, setPass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/proxy/visitors/me/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load visitor pass');
        return res.json();
      })
      .then((data) => {
        setPass(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  async function cancelPass() {
    if (!confirm('Are you sure you want to cancel this visitor pass?')) return;
    setCanceling(true);
    try {
      const res = await fetch(`/api/proxy/visitors/me/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to cancel pass');
      router.push('/resident/visitors');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading pass details...
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{error || 'Pass not found'}</p>
        <Link
          href="/resident/visitors"
          className="text-blue-700 underline mt-4 inline-block"
        >
          Return to list
        </Link>
      </div>
    );
  }

  const isCancellable =
    pass.status === 'INVITED' ||
    pass.status === 'APPROVED' ||
    pass.status === 'WAITING_APPROVAL';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/resident/visitors"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <PageHeader
          title="Visitor Pass"
          description="Scan this code at the gate"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              {pass.visitorName}
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                pass.status === 'APPROVED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {pass.status.replace('_', ' ')}
            </span>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-slate-500 font-medium">Visit Date</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {new Date(pass.visitDate).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-medium">Purpose</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {pass.purpose}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-medium">Vehicle</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {pass.vehicleNumber || 'None'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-medium">Guests</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {pass.numberOfGuests}
              </dd>
            </div>
          </dl>

          {isCancellable && (
            <div className="mt-8 border-t border-red-100 pt-6">
              <Button
                onClick={cancelPass}
                disabled={canceling}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-2 size-4" />
                {canceling ? 'Canceling...' : 'Cancel Invitation'}
              </Button>
            </div>
          )}
        </Card>

        <Card className="flex flex-col items-center justify-center p-8 text-center">
          {pass.status === 'APPROVED' ? (
            <>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                {/* The QR code encodes a verification URL containing the opaque token */}
                <QRCodeSVG
                  value={`${window.location.origin}/guard/scan?token=${pass.qrToken}`}
                  size={200}
                  level="Q"
                />
              </div>
              <p className="mt-4 text-sm text-slate-500">Scan at the gate</p>

              <div className="mt-6 border-t border-slate-100 pt-6 w-full">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Pass Code
                </p>
                <p className="font-mono text-2xl font-bold tracking-widest text-slate-900">
                  {pass.passCode}
                </p>
              </div>
            </>
          ) : (
            <div className="text-slate-500">
              <p>QR Code is unavailable.</p>
              <p className="text-xs mt-2">Pass status: {pass.status}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

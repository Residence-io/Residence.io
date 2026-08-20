/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ScannerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pass, setPass] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const token = searchParams.get('token');
  const code = searchParams.get('code');

  function onScanSuccess(decodedText: string) {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    // Expected decodedText: "http://domain/guard/scan?token=abc"
    try {
      const url = new URL(decodedText);
      const scannedToken = url.searchParams.get('token');
      if (scannedToken) {
        router.push(`/guard/scan?token=${scannedToken}`);
      } else {
        setError('Invalid QR code format');
      }
    } catch {
      setError('Invalid QR code format');
    }
  }

  function onScanFailure(error: any) {
    // ignore
  }

  async function loadPass(type: 'qr' | 'pass', value: string) {
    setError(null);
    try {
      const res = await fetch(`/api/proxy/guard/visitors/${type}/${value}`);
      if (!res.ok) throw new Error('Invalid or unrecognized pass');
      const data = await res.json();
      setPass(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadPass('qr', token);
    } else if (code) {
      loadPass('pass', code);
    } else {
      // Init scanner
      scannerRef.current = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false,
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, code]);

  async function handleCheckIn() {
    setCheckInLoading(true);
    try {
      const res = await fetch(`/api/proxy/guard/visitors/${pass.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gate: 'Main Gate' }), // Hardcoded for demo
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Check in failed');
      }
      alert('Visitor Checked In Successfully');
      router.push('/guard/inside');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setCheckInLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center p-8">Checking pass validity...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <Link
          href="/guard"
          className="rounded bg-slate-900 px-4 py-2 text-white"
        >
          Back to Scanner
        </Link>
      </div>
    );
  }

  if (pass) {
    const isApproved = pass.status === 'APPROVED';

    return (
      <Card className="p-6 max-w-sm mx-auto">
        <div
          className={`text-center mb-6 pb-4 border-b ${isApproved ? 'border-green-100' : 'border-red-100'}`}
        >
          <h2 className="text-2xl font-bold text-slate-900">
            {pass.visitorName}
          </h2>
          <p className="mt-2 text-sm">
            Status:{' '}
            <span
              className={`font-bold uppercase ${isApproved ? 'text-green-600' : 'text-red-600'}`}
            >
              {pass.status.replace('_', ' ')}
            </span>
          </p>
        </div>

        <dl className="grid gap-4 text-sm mb-8">
          <div>
            <dt className="text-slate-500">Host Resident</dt>
            <dd className="font-semibold">
              {pass.resident?.fullName} (Unit {pass.unit?.unitNumber || 'N/A'})
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Purpose</dt>
            <dd className="font-semibold">{pass.purpose}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Vehicle</dt>
            <dd className="font-semibold">{pass.vehicleNumber || 'N/A'}</dd>
          </div>
        </dl>

        {isApproved ? (
          <Button
            onClick={handleCheckIn}
            disabled={checkInLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          >
            {checkInLoading ? 'Processing...' : 'CHECK IN NOW'}
          </Button>
        ) : (
          <p className="text-center text-slate-500">
            This pass cannot be checked in.
          </p>
        )}
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div
        id="reader"
        className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200"
      ></div>
    </div>
  );
}

export default function GuardScanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/guard"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <PageHeader title="Scan Pass" description="Scan visitor QR or Code" />
      </div>

      <Suspense
        fallback={<div className="p-8 text-center">Loading scanner...</div>}
      >
        <ScannerContent />
      </Suspense>
    </div>
  );
}

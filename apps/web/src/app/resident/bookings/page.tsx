'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  Building,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react';

interface Booking {
  id: string;
  facility: {
    id: string;
    name: string;
    location: string | null;
    category: string;
    currency: string;
  };
  bookingDate: string;
  startsAt: string;
  endsAt: string;
  guestCount: number | null;
  purpose: string | null;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'NO_SHOW';
  bookingFee: string | number;
}

export default function ResidentBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'PENDING' | 'PAST'>(
    'ALL',
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const fetchBookings = () => {
    fetch('/api/facility-bookings/me')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancellingId(id);
    setActionError('');

    try {
      const res = await fetch(`/api/facility-bookings/me/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by resident' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to cancel booking.');
      }

      fetchBookings();
    } catch (err: any) {
      setActionError(err.message || 'Error cancelling booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();

  const filtered = bookings.filter((b) => {
    const start = new Date(b.startsAt);
    if (filter === 'UPCOMING')
      return (
        (b.status === 'CONFIRMED' || b.status === 'PENDING') && start > now
      );
    if (filter === 'PENDING') return b.status === 'PENDING';
    if (filter === 'PAST')
      return (
        start <= now ||
        b.status === 'COMPLETED' ||
        b.status === 'CANCELLED' ||
        b.status === 'REJECTED'
      );
    return true;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="size-3" /> Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <Clock className="size-3" /> Pending Approval
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            <Ban className="size-3" /> Cancelled
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            <XCircle className="size-3" /> Rejected
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            Completed
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="My Activities"
          title="Facility Reservations"
          description="View your upcoming, pending, and past facility bookings."
        />
        <Link
          href="/resident/facilities"
          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors self-start sm:self-auto"
        >
          <Building className="size-4" />
          Browse Facilities
        </Link>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-3">
          <AlertCircle className="size-5 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['ALL', 'UPCOMING', 'PENDING', 'PAST'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === tab
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'ALL'
              ? 'All Bookings'
              : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading your bookings...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center space-y-3">
          <Calendar className="mx-auto size-10 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-800">
            No bookings found
          </h3>
          <p className="text-sm text-slate-500">
            You have no reservations matching the selected filter.
          </p>
          <Link
            href="/resident/facilities"
            className="inline-block rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            Browse Facilities
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const start = new Date(b.startsAt);
            const end = new Date(b.endsAt);
            const isCancellable =
              (b.status === 'CONFIRMED' || b.status === 'PENDING') &&
              start > now;

            return (
              <Card
                key={b.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      {b.facility.name}
                    </h4>
                    {getStatusBadge(b.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Calendar className="size-3.5" />
                      {start.toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {start.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}{' '}
                      -{' '}
                      {end.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                    {b.purpose && <span>Purpose: {b.purpose}</span>}
                    {b.guestCount && <span>Guests: {b.guestCount}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {isCancellable && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                      className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  Calendar,
  Clock,
  Check,
  X,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export default function AdminFacilityBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = () => {
    fetch('/api/admin/facility-bookings')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        setBookings(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/facility-bookings/${id}/approve`, {
        method: 'PATCH',
      });
      fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    setActionLoading(id);
    try {
      await fetch(`/api/admin/facility-bookings/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason || 'Declined by administration',
        }),
      });
      fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/facility-bookings/${id}/complete`, {
        method: 'PATCH',
      });
      fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (filterStatus === 'ALL') return true;
    return b.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/facilities"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mb-2"
          >
            <ArrowLeft className="size-3.5" /> Back to Facilities Configuration
          </Link>
          <PageHeader
            eyebrow="Operations"
            title="Facility Bookings & Approvals"
            description="Manage resident reservations, approve requests, and monitor utilization."
          />
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          'ALL',
          'PENDING',
          'CONFIRMED',
          'COMPLETED',
          'CANCELLED',
          'REJECTED',
        ].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status === 'ALL' ? 'All Bookings' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading bookings...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <Calendar className="mx-auto size-10 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            No bookings found
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            There are no reservations matching this filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const start = new Date(booking.startsAt);
            const end = new Date(booking.endsAt);

            return (
              <Card
                key={booking.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {booking.facility.name}
                    </h4>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : booking.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : booking.status === 'CANCELLED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-slate-800">
                      Resident: {booking.resident.fullName} (#
                      {booking.resident.residentNumber})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-slate-400" />
                      {start.toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-slate-400" />
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
                    {booking.purpose && <span>Purpose: {booking.purpose}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {booking.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Check className="size-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-1"
                      >
                        <X className="size-3.5" /> Reject
                      </button>
                    </>
                  )}

                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleComplete(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                    >
                      <CheckCircle2 className="size-3.5 text-blue-600" /> Mark
                      Complete
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

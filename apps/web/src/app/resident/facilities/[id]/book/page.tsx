'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Clock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface TimeSlot {
  startsAt: string;
  endsAt: string;
  available: boolean;
  reason?: string;
}

export default function ResidentBookFacilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [facility, setFacility] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [guestCount, setGuestCount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/facilities/me/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setFacility(data));
  }, [id]);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/facilities/${id}/availability?date=${date}`)
      .then((res) => (res.ok ? res.json() : { slots: [] }))
      .then((data) => {
        if (!ignore) {
          setSlots(data.slots || []);
          setSelectedSlot(null);
          setError('');
          setLoadingSlots(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setLoadingSlots(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/facility-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: id,
          bookingDate: date,
          startsAt: selectedSlot.startsAt,
          endsAt: selectedSlot.endsAt,
          guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
          purpose: purpose || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit booking.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/resident/bookings');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during booking.');
      setSubmitting(false);
    }
  };

  const formatSlotTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={`/resident/facilities/${id}`}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to Facility Details
      </Link>

      <PageHeader
        eyebrow="Reservation"
        title={facility ? `Book ${facility.name}` : 'Book Facility'}
        description="Select a date and available time slot to complete your reservation."
      />

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="size-5 text-emerald-600" />
          <span>
            Booking successfully created! Redirecting to your bookings...
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-3">
          <AlertCircle className="size-5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            1. Select Date
          </h3>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Booking Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            2. Select Time Slot
          </h3>

          {loadingSlots ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Checking availability...
            </div>
          ) : slots.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No slots available for this facility on the selected date.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {slots.map((slot, index) => {
                const isSelected =
                  selectedSlot?.startsAt === slot.startsAt &&
                  selectedSlot?.endsAt === slot.endsAt;

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl p-3 text-left border text-xs transition-all flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600 ring-offset-1 font-semibold'
                        : slot.available
                          ? 'border-slate-200 bg-white hover:border-blue-300 text-slate-800'
                          : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatSlotTime(slot.startsAt)} -{' '}
                      {formatSlotTime(slot.endsAt)}
                    </span>
                    <span className="text-[10px]">
                      {slot.available
                        ? 'Available'
                        : slot.reason || 'Unavailable'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            3. Booking Details
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Expected Guests (Optional)
              </label>
              <input
                type="number"
                min="1"
                max={facility?.capacity || 500}
                placeholder={
                  facility?.capacity ? `Max ${facility.capacity}` : 'e.g. 4'
                }
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Purpose / Event (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Birthday celebration, workout"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Special Notes / Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any special requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </Card>

        {facility && (
          <Card className="bg-slate-50 border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Facility Booking Fee:</span>
              <span className="font-semibold text-slate-900">
                {Number(facility.bookingFee) > 0
                  ? `${facility.currency} ${Number(facility.bookingFee).toLocaleString()}`
                  : 'Free'}
              </span>
            </div>
            {Number(facility.depositAmount) > 0 && (
              <div className="flex justify-between text-xs text-slate-600">
                <span>Security Deposit:</span>
                <span className="font-semibold text-slate-900">
                  {facility.currency}{' '}
                  {Number(facility.depositAmount).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
              <span>Approval Requirement:</span>
              <span>
                {facility.requiresApproval
                  ? 'Requires Admin Approval'
                  : 'Instant Confirmation'}
              </span>
            </div>
          </Card>
        )}

        <button
          type="submit"
          disabled={!selectedSlot || submitting || success}
          className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors ${
            !selectedSlot || submitting || success
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitting ? 'Submitting Reservation...' : 'Confirm & Reserve Slot'}
        </button>
      </form>
    </div>
  );
}

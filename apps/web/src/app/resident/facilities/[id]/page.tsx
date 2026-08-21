'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  MapPin,
  Users,
  Clock,
  ShieldAlert,
  FileText,
  AlertCircle,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

export default function ResidentFacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/facilities/me/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setFacility(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Loading facility details...
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="space-y-4">
        <Link
          href="/resident/facilities"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="size-4" /> Back to Facilities
        </Link>
        <Card className="py-12 text-center">
          <h3 className="text-base font-semibold text-slate-800">
            Facility not found
          </h3>
        </Card>
      </div>
    );
  }

  const isMaintenance = facility.status === 'UNDER_MAINTENANCE';
  const unavailable = facility.status !== 'ACTIVE';

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/resident/facilities"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to Facilities
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow={facility.category}
          title={facility.name}
          description={facility.location || 'Society Amenity'}
        />
        <Link
          href={`/resident/facilities/${facility.id}/book`}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors self-start sm:self-auto ${
            unavailable
              ? 'bg-slate-300 pointer-events-none'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Book Facility
        </Link>
      </div>

      {unavailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-center gap-3">
          <AlertCircle className="size-5 shrink-0 text-amber-600" />
          <span>
            {isMaintenance
              ? 'This facility is currently under maintenance and unavailable for new bookings.'
              : 'This facility is currently inactive.'}
          </span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              About this Facility
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {facility.description || 'No detailed description provided.'}
            </p>
          </div>

          {facility.rules && (
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                <FileText className="size-4 text-slate-500" />
                <span>Facility Rules & Guidelines</span>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {facility.rules}
              </p>
            </div>
          )}

          {facility.cancellationPolicy && (
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                <ShieldAlert className="size-4 text-slate-500" />
                <span>Cancellation Policy</span>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {facility.cancellationPolicy}
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Booking Information
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="size-3.5" /> Operating Hours
                </span>
                <span className="font-medium text-slate-800">
                  {facility.openingTime} - {facility.closingTime}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="size-3.5" /> Slot Duration
                </span>
                <span className="font-medium text-slate-800">
                  {facility.bookingDurationMinutes} mins
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="size-3.5" /> Advance Booking
                </span>
                <span className="font-medium text-slate-800">
                  Up to {facility.advanceBookingDays} days
                </span>
              </div>

              {facility.capacity && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Users className="size-3.5" /> Max Capacity
                  </span>
                  <span className="font-medium text-slate-800">
                    {facility.capacity} guests
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Booking Fee:</span>
                <span className="font-bold text-slate-900">
                  {Number(facility.bookingFee) > 0
                    ? `${facility.currency} ${Number(facility.bookingFee).toLocaleString()}`
                    : 'Free'}
                </span>
              </div>

              {Number(facility.depositAmount) > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="font-bold text-slate-900">
                    {facility.currency}{' '}
                    {Number(facility.depositAmount).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Approval Required:</span>
                <span className="font-medium text-slate-800">
                  {facility.requiresApproval
                    ? 'Yes (Admin approval)'
                    : 'No (Instant)'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

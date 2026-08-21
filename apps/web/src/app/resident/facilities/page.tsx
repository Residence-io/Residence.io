'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  Building,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  category: string;
  capacity: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
  openingTime: string;
  closingTime: string;
  bookingDurationMinutes: number;
  bookingFee: string | number;
  depositAmount: string | number;
  currency: string;
  requiresApproval: boolean;
}

export default function ResidentFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetch('/api/facilities/me')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setFacilities(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = [
    'ALL',
    ...Array.from(new Set(facilities.map((f) => f.category))),
  ];

  const filtered = facilities.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.location && f.location.toLowerCase().includes(search.toLowerCase()));
    const matchesCat =
      selectedCategory === 'ALL' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Amenities"
          title="Society Facilities"
          description="Browse and reserve society amenities, halls, and sports areas."
        />
        <Link
          href="/resident/bookings"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors self-start sm:self-auto"
        >
          <CalendarCheck className="size-4" />
          My Bookings
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search facilities or locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading facilities...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <Building className="mx-auto size-10 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            No facilities found
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Try adjusting your search or category filter.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((facility) => {
            const isMaintenance = facility.status === 'UNDER_MAINTENANCE';
            const isInactive = facility.status === 'INACTIVE';
            const unavailable = isMaintenance || isInactive;

            return (
              <Card
                key={facility.id}
                className="flex flex-col justify-between overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {facility.category}
                    </span>
                    {unavailable ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                        <AlertCircle className="size-3" />
                        {isMaintenance ? 'Under Maintenance' : 'Inactive'}
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        Available
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {facility.name}
                    </h3>
                    {facility.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {facility.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    {facility.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-slate-400" />
                        <span>{facility.location}</span>
                      </div>
                    )}
                    {facility.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-slate-400" />
                        <span>Capacity: {facility.capacity} guests</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-slate-400" />
                      <span>
                        Hours: {facility.openingTime} - {facility.closingTime} (
                        {facility.bookingDurationMinutes} min slots)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Fee per slot
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {Number(facility.bookingFee) > 0
                        ? `${facility.currency} ${Number(facility.bookingFee).toLocaleString()}`
                        : 'Free'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/resident/facilities/${facility.id}`}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Details
                    </Link>
                    <Link
                      href={`/resident/facilities/${facility.id}/book`}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
                        unavailable
                          ? 'bg-slate-300 pointer-events-none'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

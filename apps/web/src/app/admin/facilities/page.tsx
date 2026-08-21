'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  Building,
  Plus,
  CalendarCheck,
  Clock,
  Users,
  MapPin,
  Wrench,
} from 'lucide-react';

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hall',
    location: '',
    description: '',
    capacity: '50',
    openingTime: '08:00',
    closingTime: '22:00',
    bookingDurationMinutes: '60',
    advanceBookingDays: '14',
    bookingFee: '0',
    depositAmount: '0',
    requiresApproval: false,
    rules: '',
  });

  const fetchFacilities = () => {
    fetch('/api/admin/facilities')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setFacilities(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/admin/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity
            ? parseInt(formData.capacity, 10)
            : undefined,
          bookingDurationMinutes: parseInt(formData.bookingDurationMinutes, 10),
          advanceBookingDays: parseInt(formData.advanceBookingDays, 10),
          bookingFee: parseFloat(formData.bookingFee || '0'),
          depositAmount: parseFloat(formData.depositAmount || '0'),
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          category: 'Hall',
          location: '',
          description: '',
          capacity: '50',
          openingTime: '08:00',
          closingTime: '22:00',
          bookingDurationMinutes: '60',
          advanceBookingDays: '14',
          bookingFee: '0',
          depositAmount: '0',
          requiresApproval: false,
          rules: '',
        });
        fetchFacilities();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'ACTIVE' ? 'UNDER_MAINTENANCE' : 'ACTIVE';
    await fetch(`/api/admin/facilities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchFacilities();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Operations"
          title="Facility Management"
          description="Configure society amenities, operating hours, fees, and rules."
        />
        <div className="flex gap-2 self-start sm:self-auto">
          <Link
            href="/admin/facilities/bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <CalendarCheck className="size-4" />
            Bookings & Schedule
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="size-4" />
            Add Facility
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading facilities...
        </div>
      ) : facilities.length === 0 ? (
        <Card className="py-12 text-center">
          <Building className="mx-auto size-10 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            No facilities configured
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Get started by creating your society&apos;s first amenity.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Card
              key={facility.id}
              className="flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {facility.category}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      facility.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : facility.status === 'UNDER_MAINTENANCE'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {facility.status.replace('_', ' ')}
                  </span>
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

                <div className="space-y-1 text-xs text-slate-600">
                  {facility.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-slate-400" />
                      <span>{facility.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-slate-400" />
                    <span>
                      {facility.openingTime} - {facility.closingTime} (
                      {facility.bookingDurationMinutes}m slots)
                    </span>
                  </div>
                  {facility.capacity && (
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-slate-400" />
                      <span>Capacity: {facility.capacity}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">
                    Fee
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {Number(facility.bookingFee) > 0
                      ? `${facility.currency} ${Number(facility.bookingFee).toLocaleString()}`
                      : 'Free'}
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleStatusToggle(facility.id, facility.status)
                  }
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                >
                  <Wrench className="size-3" />
                  {facility.status === 'ACTIVE'
                    ? 'Set Maintenance'
                    : 'Set Active'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              Create New Facility
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Community Hall"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="Hall">Community Hall</option>
                    <option value="Gym">Gym</option>
                    <option value="Pool">Swimming Pool</option>
                    <option value="Sports">Sports Court</option>
                    <option value="BBQ">BBQ / Outdoor Area</option>
                    <option value="Meeting">Meeting Room</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clubhouse Floor 1"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Guest Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, openingTime: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, closingTime: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Slot Duration (min)
                  </label>
                  <input
                    type="number"
                    value={formData.bookingDurationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bookingDurationMinutes: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Booking Fee (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.bookingFee}
                    onChange={(e) =>
                      setFormData({ ...formData, bookingFee: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Security Deposit (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        depositAmount: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requiresApproval: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600"
                />
                <label
                  htmlFor="requiresApproval"
                  className="text-xs font-medium text-slate-700"
                >
                  Requires Admin Approval before confirmation
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {creating ? 'Creating...' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

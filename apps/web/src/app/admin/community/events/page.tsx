'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('COMMUNITY_EVENT');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/proxy/admin/community/events');
      if (res.ok) setEvents(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/proxy/admin/community/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        eventType,
        location,
        startsAt,
        endsAt,
      }),
    });
    if (res.ok) {
      setShowModal(false);
      setTitle('');
      fetchEvents();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Community"
          title="Community Calendar Management"
          description="Schedule and broadcast society meetings, shutdowns, and community notices."
        />
        <Button
          onClick={() => setShowModal(true)}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="size-4" /> Create Event
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Type</th>
              <th className="p-4">Location</th>
              <th className="p-4">Starts At</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="p-4 font-semibold text-slate-900">{e.title}</td>
                <td className="p-4 text-xs">{e.eventType}</td>
                <td className="p-4 text-xs text-slate-600">
                  {e.location || 'Society Grounds'}
                </td>
                <td className="p-4 text-xs">
                  {new Date(e.startsAt).toLocaleString()}
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Schedule Society Event
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title
                </label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type
                </label>
                <select
                  value={eventType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEventType(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="COMMUNITY_EVENT">Community Event</option>
                  <option value="SOCIETY_MEETING">Society Meeting</option>
                  <option value="AGM">Annual General Meeting (AGM)</option>
                  <option value="WATER_SHUTDOWN">Water Shutdown Notice</option>
                  <option value="POWER_MAINTENANCE">
                    Power Maintenance Notice
                  </option>
                  <option value="GENERAL">General Announcement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Club House"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <Button type="submit">Publish Event</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

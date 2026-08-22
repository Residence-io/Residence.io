'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Calendar, PhoneCall, Clock, MapPin, Users, Zap } from 'lucide-react';

interface CommunityEvt {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  status: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  category: string;
  phone: string;
  description?: string;
}

export default function ResidentCommunityPage() {
  const [events, setEvents] = useState<CommunityEvt[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  const fetchCommunityData = useCallback(() => {
    Promise.all([
      fetch('/api/proxy/community/events').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/proxy/community/emergency-contacts').then((r) =>
        r.ok ? r.json() : [],
      ),
    ])
      .then(([eventsData, contactsData]) => {
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setContacts(Array.isArray(contactsData) ? contactsData : []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'WATER_SHUTDOWN':
      case 'POWER_MAINTENANCE':
      case 'MAINTENANCE':
        return <Zap className="size-4 text-amber-600" />;
      case 'AGM':
      case 'SOCIETY_MEETING':
        return <Users className="size-4 text-blue-600" />;
      default:
        return <Calendar className="size-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Community"
          title="Community Calendar & Noticeboard"
          description="Stay updated with society meetings, maintenance shutdowns, and events."
        />
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Link href="/resident/community/polls">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              <Users className="size-4" /> Voting & Polls
            </span>
          </Link>
          <Link href="/resident/emergency">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              <PhoneCall className="size-4" /> Emergency Directory
            </span>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">
            Society Events & Notices
          </h3>
          {events.length === 0 ? (
            <Card className="py-8 text-center">
              <Calendar className="mx-auto size-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">
                No scheduled society events at this time.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <Card
                  key={evt.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(evt.eventType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                        {evt.status === 'SCHEDULED' && (
                          <span className="size-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-900 mt-1">
                        {evt.title}
                      </h4>
                      {evt.description && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {evt.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {new Date(evt.startsAt).toLocaleDateString()}{' '}
                          {new Date(evt.startsAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {evt.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {evt.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">
              Quick Emergency Help
            </h3>
            <Link
              href="/resident/emergency"
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View All
            </Link>
          </div>
          <Card className="p-4 divide-y divide-slate-100">
            {contacts.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
              >
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm">
                    {c.name}
                  </h5>
                  <p className="text-xs text-slate-400">{c.category}</p>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 flex items-center gap-1.5"
                >
                  <PhoneCall className="size-3.5" /> Call
                </a>
              </div>
            ))}
            {contacts.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400">
                No emergency contacts configured yet.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

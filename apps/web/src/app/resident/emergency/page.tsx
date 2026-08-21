'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  PhoneCall,
  Shield,
  Flame,
  Activity,
  Wrench,
  Building,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  category: string;
  phone: string;
  alternatePhone?: string;
  description?: string;
}

export default function EmergencyDirectoryPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/community/emergency-contacts')
      .then((res) => res.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('gate') || c.includes('security') || c.includes('police'))
      return <Shield className="size-6 text-red-600" />;
    if (c.includes('fire')) return <Flame className="size-6 text-orange-600" />;
    if (c.includes('ambulance') || c.includes('hospital'))
      return <Activity className="size-6 text-emerald-600" />;
    if (
      c.includes('maintenance') ||
      c.includes('electrician') ||
      c.includes('plumber')
    )
      return <Wrench className="size-6 text-blue-600" />;
    return <Building className="size-6 text-purple-600" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Emergency"
        title="Emergency Directory"
        description="Immediate tap-to-call contact directory for society security, administration, and municipal rescue services."
      />

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          Loading emergency directory...
        </div>
      ) : contacts.length === 0 ? (
        <Card className="py-12 text-center">
          <PhoneCall className="mx-auto size-12 text-slate-300 mb-2" />
          <h4 className="font-semibold text-slate-800">
            No contacts configured
          </h4>
          <p className="text-xs text-slate-400">
            Please contact society office for emergency numbers.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map((c) => (
            <Card
              key={c.id}
              className="p-5 flex flex-col justify-between border-slate-200 hover:border-red-300 transition-colors"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 rounded-xl bg-red-50 flex items-center justify-center">
                    {getIcon(c.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {c.name}
                    </h3>
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {c.category}
                    </span>
                  </div>
                </div>
                {c.description && (
                  <p className="text-xs text-slate-500 mb-4">{c.description}</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={`tel:${c.phone}`}
                  className="flex-1 rounded-xl bg-red-600 text-white font-bold text-sm py-3 px-4 flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-sm"
                >
                  <PhoneCall className="size-4" /> Call {c.phone}
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

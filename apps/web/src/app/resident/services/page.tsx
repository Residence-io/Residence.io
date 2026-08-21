import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
  AlertTriangle,
  Wrench,
  Users,
  Package,
  Car,
  Building,
} from 'lucide-react';

export default function ServicesOverview() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Services"
        title="Services & Access"
        description="Manage your requests, visitors, parcels, and vehicles."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Users className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">Visitors</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Invite guests, generate QR codes, and view check-in history.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-blue-600 px-4 py-2 text-white font-medium text-sm flex-1 text-center"
              href="/resident/visitors"
            >
              Manage Visitors
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
            <Package className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">Deliveries</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Track parcels waiting at the gate and collection history.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-purple-600 px-4 py-2 text-white font-medium text-sm flex-1 text-center"
              href="/resident/deliveries"
            >
              My Deliveries
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Car className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">Vehicles & Parking</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Register your vehicles and manage parking permits.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white font-medium text-sm flex-1 text-center"
              href="/resident/vehicles"
            >
              My Vehicles
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <AlertTriangle className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">Complaints</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Report issues regarding security, neighbors, or rules.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-slate-100 px-4 py-2 text-slate-700 font-medium text-sm flex-1 text-center hover:bg-slate-200 transition-colors"
              href="/resident/complaints"
            >
              History
            </Link>
            <Link
              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 font-medium text-sm flex-1 text-center hover:bg-slate-50 transition-colors"
              href="/resident/complaints/new"
            >
              New
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
            <Wrench className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">Maintenance</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Request repairs or technical assistance for your unit.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-slate-100 px-4 py-2 text-slate-700 font-medium text-sm flex-1 text-center hover:bg-slate-200 transition-colors"
              href="/resident/maintenance"
            >
              History
            </Link>
            <Link
              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 font-medium text-sm flex-1 text-center hover:bg-slate-50 transition-colors"
              href="/resident/maintenance/new"
            >
              Request
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <Building className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">Facilities & Amenities</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Reserve community halls, gym, pool, courts, and event spaces.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-teal-600 px-4 py-2 text-white font-medium text-sm flex-1 text-center hover:bg-teal-700 transition-colors"
              href="/resident/facilities"
            >
              Browse & Book
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Users className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">My Documents</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Access and upload verified CNIC, tenancy, and property documents.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium text-sm flex-1 text-center hover:bg-indigo-700 transition-colors"
              href="/resident/documents"
            >
              View Documents
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">Requests & NOCs</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Apply for certificates, renovation permissions, and clearance
            letters.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-amber-600 px-4 py-2 text-white font-medium text-sm flex-1 text-center hover:bg-amber-700 transition-colors"
              href="/resident/requests"
            >
              My Requests
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <Users className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">Community Calendar</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            View scheduled society meetings, shutdowns, and notices.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-sky-600 px-4 py-2 text-white font-medium text-sm flex-1 text-center hover:bg-sky-700 transition-colors"
              href="/resident/community"
            >
              Calendar & Notices
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
            <AlertTriangle className="size-5" />
          </div>
          <h2 className="text-xl font-bold mb-2">Emergency Contacts</h2>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Direct tap-to-call emergency directory for security and medical
            rescue.
          </p>
          <div className="flex gap-3">
            <Link
              className="rounded-xl bg-rose-600 px-4 py-2 text-white font-medium text-sm flex-1 text-center hover:bg-rose-700 transition-colors"
              href="/resident/emergency"
            >
              Emergency Directory
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

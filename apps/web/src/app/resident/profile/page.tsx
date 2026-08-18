import { API_URL } from '@/lib/api-client';
import { serverApi } from '@/lib/api.server';
import type { ResidentDetail } from '@/lib/resident-types';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/api.server';
import { CorrectionRequestForm } from '@/components/phase7/correction-request-form';

export default async function ResidentProfilePage() {
  const [resident, user, corrections] = await Promise.all([
    serverApi<ResidentDetail>('/residents/me'),
    getCurrentUser(),
    serverApi<
      { id: string; requestType: string; status: string; createdAt: string }[]
    >('/profile/me/correction-requests'),
  ]);
  const active = resident.occupancies.find((o: any) => !o.endDate);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={resident.residentNumber}
        title="My Profile"
        description="Your approved resident, household, property, and ID-card information."
      />
      <Card>
        <h2 className="font-bold">Personal information</h2>
        <p className="mt-3">{resident.fullName}</p>
        <p className="text-sm text-slate-600">
          {resident.primaryPhone} · {resident.email ?? 'No email'}
        </p>
        <p className="mt-2 text-sm">
          NIC: {resident.maskedIdentityNumber ?? resident.identityNumber ?? 'Not recorded'}
        </p>
      </Card>
      <Card>
        <h2 className="font-bold">Profile security and corrections</h2>
        <p className="mt-2 text-sm text-slate-600">
          Contact fields may be updated through approved profile controls.
          Identity, occupancy, and tenancy corrections require administrator
          review.
        </p>
        <Link
          className="mt-3 inline-block font-semibold text-blue-700"
          href="/resident/profile/security"
        >
          Security and password →
        </Link>
        <CorrectionRequestForm csrfToken={user?.csrfToken ?? ''} />
        {corrections.length ? (
          <ul className="mt-4 space-y-1 text-sm">
            {corrections.map((request: any) => (
              <li key={request.id}>
                {request.requestType} · {request.status} ·{' '}
                {new Date(request.createdAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
      <Card>
        <h2 className="font-bold">My residence</h2>
        <p className="mt-3 text-sm">
          {active
            ? `Block ${active.unit.property.block}, unit ${active.unit.unitNumber} · ${active.occupancyType}`
            : 'No active occupancy'}
        </p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-bold">Family Members</h2>
          <ul className="mt-3 text-sm">
            {resident.householdMembers
              .filter((member: any) => member.status !== 'INACTIVE')
              .map((m: any) => (
                <li key={m.id}>
                  {m.fullName} · Age {m.age ?? 'not recorded'} ·{' '}
                  {m.phone ?? 'No phone'}
                </li>
              ))}
          </ul>
          <Link
            className="mt-4 inline-block font-semibold text-blue-700"
            href="/resident/profile/family-members"
          >
            Manage Family Members →
          </Link>
        </Card>
        <Card>
          <h2 className="font-bold">Vehicles</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {resident.vehicles
              .filter((v: any) => v.active)
              .map((v: any) => (
                <li
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-3"
                  key={v.id}
                >
                  <span>
                    <span className="text-slate-500">Vehicle type</span>
                    <br />
                    <strong>{v.type}</strong>
                  </span>
                  <span>
                    <span className="text-slate-500">Vehicle number plate</span>
                    <br />
                    <strong>{v.registrationNumber}</strong>
                  </span>
                  <span>
                    <span className="text-slate-500">Vehicle name</span>
                    <br />
                    <strong>{v.name ?? 'Name not recorded'}</strong>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
      <Card>
        <h2 className="font-bold">My documents and ID card</h2>
        <ul className="mt-3 text-sm">
          {resident.documents.map((d: any) => (
            <li key={d.id}>
              <a
                className="font-semibold text-blue-700"
                href={`${API_URL}/residents/${resident.id}/documents/${d.id}`}
              >
                {d.originalFileName}
              </a>
            </li>
          ))}
        </ul>
        {resident.idCards.some((c: any) => c.status === 'ACTIVE') && (
          <a
            className="mt-4 inline-block font-semibold text-blue-700"
            href={`${API_URL}/residents/${resident.id}/id-card`}
          >
            Download my ID card
          </a>
        )}
      </Card>
    </div>
  );
}

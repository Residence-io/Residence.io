import { fetchResident } from '@/lib/supabase-data.server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { getCurrentUser } from '@/lib/api.server';
import type { ResidentDetail } from '@/lib/resident-types';
import { Card } from '@/components/ui/card';
import { ResidentActions } from '@/components/residents/resident-actions';
import { ResidentRelatedAddButton } from '@/components/residents/resident-related-add-button';

function displayDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : 'Not recorded';
}

export default async function ResidentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; account?: string }>;
}) {
  const { id } = await params;
  const notice = await searchParams;
  let resident: ResidentDetail;
  try {
    resident = (await fetchResident(id)) as unknown as ResidentDetail;
  } catch {
    notFound();
  }
  const user = await getCurrentUser();
  const activeOccupancy = (resident.occupancies ?? []).find(
    (item) => !item.endDate,
  );
  const activeCard = (resident.idCards ?? []).find(
    (card) => card.status === 'ACTIVE',
  );
  const activeVehicles = (resident.vehicles ?? []).filter(
    (vehicle) => vehicle.active,
  );
  const houseNumber = activeOccupancy
    ? activeOccupancy.unit?.unitNumber ===
      activeOccupancy.unit?.property?.propertyNumber
      ? activeOccupancy.unit?.property?.propertyNumber
      : `${activeOccupancy.unit?.property?.propertyNumber ?? ''}/${activeOccupancy.unit?.unitNumber ?? ''}`
    : 'No active house';
  const cardOutdated = Boolean(
    activeCard &&
    resident.profilePhotograph &&
    new Date(resident.profilePhotograph.createdAt) >
      new Date(activeCard.issuedAt),
  );
  const photographVersion = encodeURIComponent(
    resident.profilePhotograph?.createdAt ?? 'none',
  );
  const permissions = new Set(user?.permissions ?? []);
  const canUpdate = permissions.has('RESIDENT_UPDATE');
  const canManageStatus = permissions.has('RESIDENT_STATUS_CHANGE');
  const canArchive = permissions.has('RESIDENT_ARCHIVE');
  const canManageDocuments = permissions.has('RESIDENT_DOCUMENT_MANAGE');
  const canManageCard = permissions.has('RESIDENT_ID_CARD_MANAGE');

  return (
    <div className="space-y-6">
      {notice.created === '1' && (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
          role="status"
        >
          Resident registered successfully.
          {notice.account === '1'
            ? ' Share the temporary password securely; it cannot be retrieved later.'
            : ''}
        </p>
      )}
      <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-800">
            {resident.profilePhotograph ? (
              <Image
                alt={`${resident.fullName} profile photograph`}
                className="object-cover"
                fill
                priority
                sizes="112px"
                src={`/admin/residents/${id}/id-card-preview?asset=photograph&v=${photographVersion}`}
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center px-3 text-center text-sm text-slate-300">
                Photo unavailable
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-blue-300">
              {resident.residentNumber}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {resident.fullName}
            </h1>
            <div className="mt-4 grid gap-x-8 gap-y-2 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              <p>
                <span className="text-slate-400">Status</span>
                <br />
                {resident.status === 'MOVED_OUT' ||
                resident.status === 'ARCHIVED'
                  ? 'Previous'
                  : resident.status === 'INACTIVE' ||
                      resident.status === 'SUSPENDED' ||
                      (resident.user && resident.user.status !== 'ACTIVE')
                    ? 'Inactive'
                    : 'Active'}
              </p>
              <p>
                <span className="text-slate-400">Residence</span>
                <br />
                {activeOccupancy
                  ? `${activeOccupancy.unit?.property?.block} / ${activeOccupancy.unit?.unitNumber}`
                  : 'No active occupancy'}
              </p>
              <p>
                <span className="text-slate-400">Occupancy</span>
                <br />
                {activeOccupancy?.occupancyType === 'TENANT'
                  ? 'Rental'
                  : (activeOccupancy?.occupancyType ?? 'Not recorded')}
              </p>
              <p>
                <span className="text-slate-400">Phone</span>
                <br />
                {resident.primaryPhone}
              </p>
              <p>
                <span className="text-slate-400">NIC Number</span>
                <br />
                {resident.identityNumber ?? 'Not recorded'}
              </p>
              <p>
                <span className="text-slate-400">Move-in</span>
                <br />
                {displayDate(activeOccupancy?.startDate)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Resident management shortcuts"
        className="flex flex-wrap gap-3"
      >
        {canUpdate && (
          <Link
            className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white"
            href={`/admin/residents/${id}/edit`}
          >
            Edit Resident
          </Link>
        )}
        <Link
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-blue-700"
          href={`/admin/payments/${id}`}
        >
          View Payments
        </Link>
        {permissions.has('AUDIT_READ') && (
          <Link
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-blue-700"
            href={`/admin/audit-logs?search=${encodeURIComponent(id)}`}
          >
            View Audit Logs
          </Link>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold">Overview</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <dt className="text-slate-500">Email</dt>
            <dd>{resident.email ?? 'Not recorded'}</dd>
            <dt className="text-slate-500">Alternate phone</dt>
            <dd>{resident.alternatePhone ?? 'Not recorded'}</dd>
            <dt className="text-slate-500">Emergency contact</dt>
            <dd>
              {resident.emergencyContactName ?? 'Not recorded'}
              {resident.emergencyContactPhone
                ? ` — ${resident.emergencyContactPhone}`
                : ''}
            </dd>
            <dt className="text-slate-500">Household size</dt>
            <dd>{resident.householdSize}</dd>
          </dl>
        </Card>

        <Card>
          <h2 className="font-bold">Residence</h2>
          <p className="mt-4 text-sm">
            {activeOccupancy
              ? `${activeOccupancy.unit?.property?.block}, ${activeOccupancy.unit?.property?.street ?? ''} ${activeOccupancy.unit?.property?.propertyNumber}, unit ${activeOccupancy.unit?.unitNumber}`
              : 'No active occupancy'}
          </p>
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">
              Occupancy history ({resident.occupancies?.length ?? 0})
            </summary>
            <ul className="mt-3 divide-y">
              {(resident.occupancies ?? []).map((item) => (
                <li className="py-2 text-sm" key={item.id}>
                  {item.occupancyType} — {item.unit?.property?.block}/
                  {item.unit?.unitNumber} — {displayDate(item.startDate)} to{' '}
                  {item.endDate ? displayDate(item.endDate) : 'current'}
                </li>
              ))}
            </ul>
          </details>
        </Card>

        <Card>
          <h2 className="font-bold">Household members</h2>
          {(resident.householdMembers ?? []).length ? (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[440px] text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="w-12 px-3 py-2">#</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="w-24 px-3 py-2">Age</th>
                    <th className="px-3 py-2">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {(resident.householdMembers ?? []).map((member, index) => (
                    <tr className="border-t border-slate-200" key={member.id}>
                      <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                      <td className="px-3 py-2 font-medium">
                        {member.fullName}
                      </td>
                      <td className="px-3 py-2">
                        {member.age ?? 'Not recorded'}
                      </td>
                      <td className="px-3 py-2">
                        {member.phone ?? 'Not recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">None recorded.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Vehicles</h2>
            {canUpdate && user && (
              <ResidentRelatedAddButton
                csrfToken={user.csrfToken}
                kind="vehicle"
                residentId={id}
              />
            )}
          </div>
          <ul className="mt-3 space-y-3 text-sm">
            {(resident.vehicles ?? []).map((vehicle) => (
              <li
                className="rounded-xl border border-slate-200 p-4"
                key={vehicle.id}
              >
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-slate-500">Vehicle type</dt>
                    <dd className="font-semibold">{vehicle.type}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Vehicle number plate</dt>
                    <dd className="font-semibold">
                      {vehicle.registrationNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Vehicle name</dt>
                    <dd className="font-semibold">
                      {vehicle.name ?? 'Name not recorded'}
                    </dd>
                  </div>
                </dl>
                {vehicle.active && activeOccupancy && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <a
                      className="font-semibold text-blue-700"
                      href={`${API_URL}/residents/${id}/vehicles/${vehicle.id}/sticker?preview=true`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview / Print Sticker
                    </a>
                    <a
                      className="font-semibold text-blue-700"
                      href={`${API_URL}/residents/${id}/vehicles/${vehicle.id}/sticker`}
                    >
                      Download Sticker
                    </a>
                  </div>
                )}
              </li>
            ))}
            {!(resident.vehicles ?? []).length && <li>None recorded.</li>}
          </ul>
          {(resident.vehicles ?? []).some((vehicle) => vehicle.active) && (
            <a
              className="mt-5 inline-block font-semibold text-blue-700"
              href={`${API_URL}/residents/${id}/vehicle-stickers?preview=true`}
              target="_blank"
              rel="noreferrer"
            >
              Print All Vehicle Stickers
            </a>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold">ID card</h2>
            {activeCard ? (
              <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Card number</dt>
                  <dd>{activeCard.cardNumber}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    {cardOutdated ? 'ACTIVE — regeneration required' : 'ACTIVE'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Issued</dt>
                  <dd>{displayDate(activeCard.issuedAt)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Expires</dt>
                  <dd>{displayDate(activeCard.expiresAt)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm">No active ID card.</p>
            )}
          </div>
          {activeCard && (
            <div className="flex flex-wrap gap-3">
              <a
                className="font-semibold text-blue-700"
                href={`/admin/residents/${id}/id-card-preview`}
                target="_blank"
                rel="noreferrer"
              >
                Preview / Print
              </a>
              <a
                className="font-semibold text-blue-700"
                href={`${API_URL}/residents/${id}/id-card`}
              >
                Download PDF
              </a>
            </div>
          )}
        </div>
        {activeCard && (
          <div className="mt-5 grid overflow-hidden rounded-xl border border-slate-300 bg-slate-100 lg:grid-cols-2">
            <section className="border-b border-slate-300 p-5 lg:border-r lg:border-b-0">
              <h3 className="text-sm font-semibold text-slate-700">
                ID card front
              </h3>
              <div className="mx-auto mt-4 max-w-md overflow-hidden rounded-lg border border-slate-300 bg-slate-50 shadow-sm">
                <div className="bg-slate-900 px-4 py-3 text-white">
                  <p className="font-bold">
                    {resident.society?.name ?? 'Residence.io Society'}
                  </p>
                  <p className="text-[10px] tracking-wide text-blue-200">
                    RESIDENT ID CARD
                  </p>
                </div>
                <div className="grid grid-cols-[76px_1fr] gap-4 p-4">
                  <div className="relative h-24 overflow-hidden rounded border border-slate-300 bg-slate-200">
                    {resident.profilePhotograph ? (
                      <Image
                        alt={`${resident.fullName} ID-card photograph`}
                        className="object-cover"
                        fill
                        sizes="76px"
                        src={`/admin/residents/${id}/id-card-preview?asset=photograph&v=${photographVersion}`}
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-slate-500">
                        Photo unavailable
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="truncate text-base font-bold">
                      {resident.fullName}
                    </p>
                    <p className="mt-1">{resident.residentNumber}</p>
                    <p className="mt-1">
                      NIC: {resident.identityNumber ?? 'Not recorded'}
                    </p>
                    <p className="mt-1">
                      {activeOccupancy
                        ? `${activeOccupancy.unit?.property?.block} / ${activeOccupancy.unit?.unitNumber}`
                        : 'No active unit'}
                    </p>
                    <p className="mt-1 font-bold">
                      {activeOccupancy?.occupancyType ?? 'NO OCCUPANCY'}
                    </p>
                  </div>
                </div>
                <p className="px-4 pb-4 text-[11px] text-slate-600">
                  Issued {displayDate(activeCard.issuedAt)} · Expires{' '}
                  {displayDate(activeCard.expiresAt)}
                </p>
              </div>
            </section>

            <section className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Vehicle stickers
                </h3>
                {activeVehicles.length > 0 && (
                  <a
                    className="text-sm font-semibold text-blue-700"
                    href={`${API_URL}/residents/${id}/vehicle-stickers?preview=true`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview / Print All
                  </a>
                )}
              </div>
              {activeVehicles.length > 0 ? (
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {activeVehicles.map((vehicle) => (
                    <a
                      className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-slate-800 bg-white p-3 text-center text-slate-950 shadow-sm"
                      href={`${API_URL}/residents/${id}/vehicles/${vehicle.id}/sticker?preview=true`}
                      key={vehicle.id}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="line-clamp-2 text-xs font-bold">
                        {resident.society?.name ?? 'Residence.io Society'}
                      </span>
                      <span className="mt-2 text-lg font-semibold">
                        {houseNumber}
                      </span>
                      <span className="mt-2 text-sm font-bold">
                        {vehicle.registrationNumber}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex min-h-56 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500">
                  No active vehicle stickers.
                </div>
              )}
            </section>
          </div>
        )}
      </Card>

      {(canUpdate ||
        canManageStatus ||
        canArchive ||
        canManageDocuments ||
        canManageCard) &&
        user && (
          <ResidentActions
            accountEmail={resident.user?.email ?? resident.email}
            accountStatus={resident.user?.status}
            accountUsername={resident.user?.username}
            canArchive={canArchive}
            canManageCard={canManageCard}
            canManageDocuments={canManageDocuments}
            canManageStatus={canManageStatus}
            canUpdate={canUpdate}
            cardOutdated={cardOutdated}
            csrfToken={user.csrfToken}
            hasAccount={Boolean(resident.user)}
            hasActiveCard={Boolean(activeCard)}
            hasActiveOccupancy={Boolean(activeOccupancy)}
            hasProfilePhotograph={Boolean(resident.profilePhotograph)}
            residentId={id}
            residentStatus={resident.status}
          />
        )}
    </div>
  );
}

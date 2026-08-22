import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { serverApi } from '@/lib/api.server';
import type { PropertyDetailRecord } from '@/lib/resident-types';

function displayDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let property: PropertyDetailRecord;
  try {
    property = await serverApi<PropertyDetailRecord>(`/properties/${id}`);
  } catch {
    notFound();
  }

  const allUnits = property.units || [];
  const occupiedCount = allUnits.filter((u) => u.status === 'OCCUPIED').length;
  const vacantCount = allUnits.filter((u) => u.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Block ${property.block} · Property 360`}
        title={`Property ${property.propertyNumber}`}
        description={`${property.type}${property.street ? ` · ${property.street}` : ''} · ${allUnits.length} unit(s) (${occupiedCount} occupied, ${vacantCount} vacant)`}
      />

      <nav aria-label="Property shortcuts" className="flex flex-wrap gap-3">
        <Link
          className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
          href="/admin/residents/new"
        >
          Assign / Add Resident
        </Link>
        <Link
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          href={`/admin/complaints?search=${encodeURIComponent(property.propertyNumber)}`}
        >
          View Complaints
        </Link>
        <Link
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          href={`/admin/maintenance?search=${encodeURIComponent(property.propertyNumber)}`}
        >
          View Maintenance
        </Link>
        <Link
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          href={`/admin/audit-logs?search=${encodeURIComponent(property.id)}`}
        >
          View Property Audit
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-bold text-slate-900">Units Overview</h2>
          <div className="mt-4 divide-y divide-slate-200">
            {allUnits.map((unit) => {
              const activeOccupancy = (unit.occupancies || []).find(
                (occ: any) => !occ.endDate,
              );
              return (
                <div key={unit.id} className="py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      Unit {unit.unitNumber}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        unit.status === 'OCCUPIED'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                          : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/10'
                      }`}
                    >
                      {unit.status}
                    </span>
                  </div>
                  {activeOccupancy ? (
                    <div className="mt-2 text-sm text-slate-600">
                      <p>
                        <strong>Resident:</strong>{' '}
                        {activeOccupancy.resident ? (
                          <Link
                            href={`/admin/residents/${activeOccupancy.resident.id}`}
                            className="font-medium text-blue-700 hover:underline"
                          >
                            {activeOccupancy.resident.fullName} (
                            {activeOccupancy.resident.residentNumber})
                          </Link>
                        ) : (
                          'Recorded'
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Type: {activeOccupancy.occupancyType} · Since{' '}
                        {displayDate(activeOccupancy.startDate)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      Currently vacant
                    </p>
                  )}
                </div>
              );
            })}
            {!allUnits.length && (
              <p className="py-4 text-sm text-slate-500">
                No units created for this property.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-slate-900">
            Occupancy History
          </h2>
          <div className="mt-4 space-y-3">
            {allUnits.flatMap((u) => u.occupancies || []).length > 0 ? (
              <ul className="divide-y divide-slate-200">
                {allUnits
                  .flatMap((unit) =>
                    (unit.occupancies || []).map((occ: any) => ({
                      ...occ,
                      unitNumber: unit.unitNumber,
                    })),
                  )
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.startDate).getTime() -
                      new Date(a.startDate).getTime(),
                  )
                  .map((occ: any) => (
                    <li key={occ.id} className="py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          Unit {occ.unitNumber} · {occ.occupancyType}
                        </span>
                        <span className="text-xs text-slate-500">
                          {displayDate(occ.startDate)} —{' '}
                          {occ.endDate ? displayDate(occ.endDate) : 'Present'}
                        </span>
                      </div>
                      {occ.resident && (
                        <p className="mt-1 text-xs text-slate-600">
                          Resident:{' '}
                          <Link
                            href={`/admin/residents/${occ.resident.id}`}
                            className="text-blue-700 hover:underline font-medium"
                          >
                            {occ.resident.fullName}
                          </Link>{' '}
                          ({occ.resident.status})
                        </p>
                      )}
                      {occ.moveOutReason && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          Move out reason: {occ.moveOutReason}
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                No occupancy records on file.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

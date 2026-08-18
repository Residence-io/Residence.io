import { serverApi } from '@/lib/api.server';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

import type { PropertyRecord } from '@/lib/resident-types';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let property: PropertyRecord;
  try {
    property = await serverApi<any>(`/properties/${id}`);
  } catch {
    notFound();
  }
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Block ${property.block}`}
        title={property.propertyNumber}
        description={`${property.type}${property.street ? ` · ${property.street}` : ''}`}
      />
      <Card>
        <h2 className="font-bold">Units and occupancy history</h2>
        <ul className="mt-3 divide-y">
          {property.units.map((unit) => (
            <li className="py-3" key={unit.id}>
              <p className="font-semibold">
                Unit {unit.unitNumber} · {unit.status}
              </p>
              <p className="text-sm text-slate-500">
                {unit.occupancies?.length
                  ? `${unit.occupancies.length} occupancy record(s)`
                  : 'No occupancy history'}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/ui/page-header';
import { PropertyCreateButton } from '@/components/properties/property-create-button';
import { getCurrentUser, serverApi } from '@/lib/api.server';

export default async function PropertiesPage() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    serverApi<{ items: any[]; total: number }>('/properties?pageSize=100'),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resident management"
        title="Properties and units"
        description={`${data.total} properties configured.`}
      />
      {user?.permissions.includes('PROPERTY_MANAGE') && (
        <div className="flex justify-end">
          <PropertyCreateButton csrfToken={user.csrfToken} />
        </div>
      )}
      {!data.items.length ? (
        <EmptyState title="No properties">
          Add a property before registering residents.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((property: any) => (
            <Card key={property.id}>
              <h2 className="font-bold">
                Block {property.block} · {property.propertyNumber}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {property.type} · {property.units.length} unit(s)
              </p>
              <Link
                className="mt-3 inline-block font-semibold text-blue-700"
                href={`/admin/properties/${property.id}`}
              >
                View property
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

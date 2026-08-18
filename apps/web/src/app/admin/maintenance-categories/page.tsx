import { serverApi } from '@/lib/api.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { CategoryForm } from '@/components/tickets/ticket-actions';
import { getCurrentUser } from '@/lib/api.server';
export default async function Categories() {
  const [items, user] = await Promise.all([
    serverApi('/tickets/categories/maintenance'),
    getCurrentUser(),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configuration"
        title="Maintenance categories"
        description="Service types mapped to Phase 4 worker capabilities."
      />
      {user && (
        <Card>
          <CategoryForm csrfToken={user.csrfToken} type="maintenance" />
        </Card>
      )}
      <Card>
        {items.map((i: any) => (
          <p className="border-b py-3" key={i.id}>
            {i.name}
          </p>
        ))}
      </Card>
    </div>
  );
}

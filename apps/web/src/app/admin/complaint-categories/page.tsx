import { fetchComplaintCategories } from '@/lib/supabase-data.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { CategoryForm } from '@/components/tickets/ticket-actions';
import { getCurrentUser } from '@/lib/api.server';
import type { TicketCategory } from '@/lib/ticket-types';
export default async function Categories() {
  const [items, user] = await Promise.all([
    fetchComplaintCategories(),
    getCurrentUser(),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configuration"
        title="Complaint categories"
        description="Configurable non-maintenance complaint types."
      />
      {user && (
        <Card>
          <CategoryForm csrfToken={user.csrfToken} type="complaint" />
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

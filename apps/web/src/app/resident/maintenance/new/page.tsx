import { fetchMaintenanceCategories } from '@/lib/supabase-data.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { TicketSubmissionForm } from '@/components/tickets/ticket-actions';
import { getCurrentUser } from '@/lib/api.server';
import type { TicketCategory } from '@/lib/ticket-types';
export default async function NewMaintenance() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    fetchMaintenanceCategories(),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Resident service"
        title="Request maintenance"
        description="Provide the location, preferred visit information, and contact-sharing consent."
      />
      <Card>
        {user && (
          <TicketSubmissionForm
            csrfToken={user.csrfToken}
            type="maintenance"
            categories={categories}
          />
        )}
      </Card>
    </div>
  );
}

import { serverApi } from '@/lib/api.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { TicketSubmissionForm } from '@/components/tickets/ticket-actions';
import { getCurrentUser } from '@/lib/api.server';
import type { TicketCategory } from '@/lib/ticket-types';
export default async function NewComplaint() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    serverApi<TicketCategory[]>('/tickets/categories/complaint'),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Resident service"
        title="Submit complaint"
        description="Choose privacy and provide enough detail for administrative review."
      />
      <Card>
        {user && (
          <TicketSubmissionForm
            csrfToken={user.csrfToken}
            type="complaint"
            categories={categories}
          />
        )}
      </Card>
    </div>
  );
}

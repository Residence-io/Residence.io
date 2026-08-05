import { Card } from '@/components/ui/card';
import { PaymentForm } from '@/components/finance/finance-actions';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser } from '@/lib/api.server';
export default async function PayPage() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="My payments"
        title="Initiate a payment"
        description="Bank transfers remain pending until an authorized reviewer validates the private proof."
      />
      <Card>
        {user && <PaymentForm csrfToken={user.csrfToken} residentMode />}
      </Card>
    </div>
  );
}

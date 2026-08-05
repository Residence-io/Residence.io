import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { API_URL } from '@/lib/api-client';
export default function FinancialReportsPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reports"
        title="Financial exports"
        description="Exports are bounded, permission-controlled, audited, and contain no provider credentials."
      />
      <Card>
        <a
          className="font-semibold text-blue-700"
          href={`${API_URL}/finance/exports/payments.csv`}
        >
          Download payment transactions CSV
        </a>
      </Card>
    </div>
  );
}

import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

export default function GuardDeliveriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Deliveries"
          description="Record parcels arriving at the gate."
        />
        <Button>Record Parcel</Button>
      </div>
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        No parcels waiting at the gate.
      </div>
    </div>
  );
}

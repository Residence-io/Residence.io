import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

export default function ResidentVehiclesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="My Vehicles & Parking"
          description="Register your vehicles and view parking permits."
        />
        <Button>Add Vehicle</Button>
      </div>
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        You haven&apos;t registered any vehicles yet.
      </div>
    </div>
  );
}

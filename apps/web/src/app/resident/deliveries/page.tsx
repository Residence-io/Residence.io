import { PageHeader } from '@/components/ui/page-header';

export default function ResidentDeliveriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Deliveries"
        description="Track parcels waiting at the gate and your collection history."
      />
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        No parcels waiting for collection.
      </div>
    </div>
  );
}

import { PageHeader } from '@/components/ui/page-header';

export default function GuardVehiclesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Lookup"
        description="Verify resident vehicles and parking permits."
      />
      <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <input
          type="text"
          placeholder="Search Registration Number..."
          className="w-full p-3 border rounded-lg"
        />
      </div>
    </div>
  );
}

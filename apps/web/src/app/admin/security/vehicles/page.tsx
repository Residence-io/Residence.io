import { Button } from '@/components/ui/button';

export default function AdminVehiclesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Vehicle Registry
        </h2>
      </div>
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        No vehicles registered.
      </div>
    </div>
  );
}

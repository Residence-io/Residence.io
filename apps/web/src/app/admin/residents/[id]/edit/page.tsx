import { fetchResident } from '@/lib/supabase-data.server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { ResidentEditForm } from '@/components/residents/resident-edit-form';
import { getCurrentUser } from '@/lib/api.server';
import type { ResidentDetail } from '@/lib/resident-types';
export default async function EditResidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let resident: ResidentDetail;
  try {
    resident = (await fetchResident(id)) as any;
  } catch {
    notFound();
  }
  const user = await getCurrentUser();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={resident.residentNumber}
        title="Edit resident"
        description="Optimistic locking prevents silent overwrites. Ownership, fees, and occupancy use controlled workflows."
      />
      <ResidentEditForm resident={resident} csrfToken={user?.csrfToken ?? ''} />
    </div>
  );
}

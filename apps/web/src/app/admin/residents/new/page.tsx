import { fetchProperties } from '@/lib/supabase-data.server';
import { PageHeader } from '@/components/ui/page-header';
import { ResidentRegistrationForm } from '@/components/residents/resident-registration-form';
import { getCurrentUser } from '@/lib/api.server';
import type { PropertyRecord } from '@/lib/resident-types';

export default async function NewResidentPage() {
  const [user, properties] = await Promise.all([
    getCurrentUser(),
    fetchProperties(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resident management"
        title="Register resident"
        description="Create an owner or tenant record, occupancy, initial fee assignment, and optional Resident account."
      />
      <ResidentRegistrationForm
        properties={properties}
        csrfToken={user?.csrfToken ?? ''}
      />
    </div>
  );
}

import { fetchDepartments } from '@/lib/supabase-data.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StaffRegistrationForm } from '@/components/workforce/workforce-actions';
import { getCurrentUser } from '@/lib/api.server';
import type { Department } from '@/lib/workforce-types';
export default async function NewStaffPage() {
  const [user, departments] = await Promise.all([
    getCurrentUser(),
    fetchDepartments(),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Staff"
        title="Register internal staff"
        description="Registration creates an employment record without granting an application role."
      />
      <Card>
        {user && (
          <StaffRegistrationForm
            csrfToken={user.csrfToken}
            departments={departments}
          />
        )}
      </Card>
    </div>
  );
}

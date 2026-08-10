import { fetchDepartments } from '@/lib/supabase-data.server';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StaffRegistrationForm } from '@/components/workforce/workforce-actions';
import { getCurrentUser } from '@/lib/api.server';

export default async function NewStaffPage() {
  let user = null;
  let departments: any[] = [];
  let pageError: string | null = null;

  try {
    [user, departments] = await Promise.all([
      getCurrentUser(),
      fetchDepartments(),
    ]);
  } catch (err: any) {
    pageError = err?.message ?? String(err);
  }

  if (pageError) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h2 style={{ color: 'red' }}>⚠️ Staff Registration Load Error</h2>
        <pre
          style={{
            background: '#fee',
            padding: '1rem',
            borderRadius: '8px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {pageError}
        </pre>
      </div>
    );
  }

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
            departments={departments as any}
          />
        )}
      </Card>
    </div>
  );
}
